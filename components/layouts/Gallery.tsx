"use client";
import { EntryItem, FormField, LooseObject } from "../../types";

import {
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Container,
    Grid,
    Typography,
    TextField,
    InputAdornment,
    Pagination
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { entryControllers } from "../../api/entryControllers";

export default function Gallery() {
  const router = useRouter();
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [templateFields, setTemplateFields] = useState<FormField[]>([]);
  const [userFields, setUserFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);

  const CONTEST_ID = "ae1fb2a4-4da5-44ed-ae85-7fb0659a1ab6";

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEntriesAndFields = async (search?: string, currentPage: number = 1) => {
    try {
      setLoading(true);
      const entriesRes = await entryControllers.getAllEntries(search, currentPage);
        
        let docs = [];
        if (entriesRes?.data?.docs) {
          docs = entriesRes.data.docs;
          setTotalPages(entriesRes.data.totalPages || 1);
        } else if (entriesRes?.docs) {
          docs = entriesRes.docs;
          setTotalPages(entriesRes.totalPages || 1);
        }
        
        // Filter entries locally by the contest ID only if there is no search query
        if (!search) {
          docs = docs.filter(
            (e: EntryItem) => e.contest_id === CONTEST_ID || e.contest?.id === CONTEST_ID
          );
        }
        
        setEntries(docs);

        const firstEntry = docs[0];
        const contestData = firstEntry?.contest;

        let tFields: FormField[] = [];
        let uFields: FormField[] = [];
        if (contestData?.entryLevelTemplate?.schema?.fields) {
          tFields = contestData.entryLevelTemplate.schema.fields;
        } else if (contestData?.entry_level_template?.schema?.fields) {
          tFields = contestData.entry_level_template.schema.fields;
        }

        if (contestData?.userLevelTemplate?.schema?.fields) {
          uFields = contestData.userLevelTemplate.schema.fields;
        } else if (contestData?.user_level_template?.schema?.fields) {
          uFields = contestData.user_level_template.schema.fields;
        }

        setTemplateFields(tFields);
        setUserFields(uFields);
        
      } catch (error) {
        console.error("Failed to fetch public entries", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchEntriesAndFields(searchQuery, page);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (page !== 1) {
      setPage(1); // Setting page to 1 will trigger useEffect
    } else {
      fetchEntriesAndFields(searchQuery, 1);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const getImageUrl = (dataObj: Record<string, string> | undefined) => {
    if (!dataObj) return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80";
    
    // Check if any specific field ID corresponds to an image upload in templateFields
    const imageField = templateFields.find(f => f.type === "image" || f.type === "file_upload" || f.label?.toLowerCase().includes("image") || f.label?.toLowerCase().includes("photo"));
    if (imageField && dataObj[`${imageField.id}_downloadUrl`]) {
      return dataObj[`${imageField.id}_downloadUrl`];
    } else if (imageField && dataObj[imageField.id] && typeof dataObj[imageField.id] === 'string' && dataObj[imageField.id].includes("http")) {
      return dataObj[imageField.id];
    }

    // Fallback attempt to find any URL in the object that looks like an image or download url
    for (const key in dataObj) {
      if (key.includes("downloadUrl") && typeof dataObj[key] === "string") {
        return dataObj[key];
      }
    }
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80";
  };

  const getTitle = (entry: EntryItem) => {
    const subData = entry?.submission?.data || {};
    let title = "";

    const entryTitleField = templateFields?.find((f: FormField) => {
      const l = f.label?.toLowerCase() || "";
      return l.includes("title") || l.includes("project") || l.includes("name");
    });

    if (entryTitleField) {
      title = subData[entryTitleField.id] || subData[entryTitleField.label];
    }

    // fallback
    if (!title) {
       title = subData["Innovation Title"] || "Participant Entry";
    }
    return title;
  };

  const getAuthor = (entry: EntryItem) => {
    const firstNameField = userFields.find((f: FormField) => {
      const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
      return l.includes("firstname") || l === "first";
    });
    const lastNameField = userFields.find((f: FormField) => {
      const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
      return l.includes("lastname") || l === "last";
    });
    const fullNameField = userFields.find((f: FormField) => {
      const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
      return l.includes("fullname") || l === "name" || (l.includes("name") && !l.includes("first") && !l.includes("last"));
    });

    const rawAuthorData = (entry?.participant?.submission?.data || entry?.participant?.user || entry?.user || entry?.author || entry?.participant || {}) as LooseObject;
    const authorData = (rawAuthorData?.data || rawAuthorData || (entry?.participant as LooseObject)?.data || (entry?.participant as LooseObject)?.participant_profile_data || {}) as Record<string, string>;
    let authorName = "";

    if (firstNameField || lastNameField) {
      const first = firstNameField ? (authorData[firstNameField.label as string] || authorData[firstNameField.id]) : "";
      const last = lastNameField ? (authorData[lastNameField.label as string] || authorData[lastNameField.id]) : "";
      authorName = `${first || ""} ${last || ""}`.trim();
    }
    
    if (!authorName && fullNameField) {
      authorName = authorData[fullNameField.label as string] || authorData[fullNameField.id];
    }

    if (!authorName) {
      const fallback = userFields.find((f: FormField) => f.label?.toLowerCase().includes("name"));
      if (fallback && (authorData[fallback.label as string] || authorData[fallback.id])) {
        authorName = authorData[fallback.label as string] || authorData[fallback.id];
      } else {
        authorName = authorData.yg9snrxlh || authorData["fullName"] || authorData["name"] || authorData["firstName"] || (entry?.author_name as string) || (entry?.participant_name as string) || (entry?.participant?.name as string) || (entry?.user?.name as string);
      }
    }

    return authorName || "Anonymous";
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Clean, Professional Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(to bottom, #ffffff, #f8fafc)",
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 8 },
          px: 3,
          textAlign: "center",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            component="h1"
            sx={{ 
              fontWeight: 800, 
              mb: 2, 
              color: "#0f172a",
              letterSpacing: "-0.02em", 
              fontSize: { xs: "2.5rem", md: "3.5rem" },
            }}
          >
            Voting <Box component="span" sx={{ color: "#6366f1" }}>Gallery</Box>
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: "#64748b",
              fontWeight: 400, 
              maxWidth: 600, 
              mx: "auto", 
              lineHeight: 1.6,
              mb: 4
            }}
          >
            Explore amazing semifinal entries and cast your vote for the best innovations that shape our future.
          </Typography>

          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by Contest Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }
              }}
            />
          </form>
        </Container>
      </Box>

      <Container sx={{ py: 8 }} maxWidth="lg">

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : entries.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography variant="h6" color="text.secondary">
            No entries available for voting at the moment.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {entries.map((entry) => {
             const title = getTitle(entry);
             const imageUrl = getImageUrl(entry?.submission?.data);
             const votes = entry.voteCount !== undefined ? entry.voteCount : 0;
             const status = entry.status || "semifinal";

             return (
               <Grid size={{xs:12,sm:6,md:4}} key={entry.id}>
                 <Card
                   sx={{
                     height: 380, // Immersive tall card
                     display: "flex",
                     flexDirection: "column",
                     borderRadius: 4,
                     position: "relative",
                     border: "none",
                     boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
                     transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                     overflow: "hidden",
                     "&:hover": {
                       transform: "translateY(-10px)",
                       boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.4)",
                       "& .card-bg-image": {
                         transform: "scale(1.08)",
                       },
                       "& .card-content-overlay": {
                         background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
                       }
                     },
                   }}
                 >
                   <Box
                     className="card-bg-image"
                     sx={{
                       position: "absolute",
                       top: 0,
                       left: 0,
                       right: 0,
                       bottom: 0,
                       backgroundImage: `url(${imageUrl})`,
                       backgroundSize: "cover",
                       backgroundPosition: "center",
                       transition: "transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)",
                     }}
                   />
                   <Box
                     className="card-content-overlay"
                     sx={{
                       position: "absolute",
                       bottom: 0,
                       left: 0,
                       right: 0,
                       p: 3,
                       pt: 8,
                       background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
                       transition: "background 0.4s ease",
                       display: "flex",
                       flexDirection: "column",
                       justifyContent: "flex-end",
                     }}
                   >
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1.5 }}>
                        <Typography
                          variant="h5"
                          component="h2"
                          sx={{
                            fontWeight: 700,
                            color: "#ffffff",
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textShadow: "0 2px 4px rgba(0,0,0,0.5)"
                          }}
                        >
                          {title}
                        </Typography>
                        
                        {entry.contest?.name && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(255,255,255,0.85)",
                              fontWeight: 500,
                              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            Contest: {entry.contest.name}
                          </Typography>
                        )}
                      </Box>
                     
                     <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                       <Chip
                         label={status}
                         size="small"
                         sx={{
                           textTransform: "capitalize",
                           fontWeight: 600,
                           bgcolor: "rgba(255, 255, 255, 0.2)",
                           color: "#ffffff",
                           backdropFilter: "blur(4px)",
                           border: "1px solid rgba(255,255,255,0.1)",
                         }}
                       />
                     </Box>

                     <Button
                       variant="contained"
                       fullWidth
                       onClick={() => router.push(`/details/${entry.id}?contestId=${entry.contest_id || entry.contest?.id || CONTEST_ID}`)}
                       sx={{
                         py: 1.2,
                         borderRadius: 2.5,
                         fontWeight: 600,
                         textTransform: "none",
                         background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                         boxShadow: "0 4px 15px rgba(99, 102, 241, 0.5)",
                         "&:hover": {
                           boxShadow: "0 8px 25px rgba(99, 102, 241, 0.6)",
                           transform: "scale(1.02)",
                         }
                       }}
                     >
                       View Details & Vote
                     </Button>
                   </Box>
                 </Card>
               </Grid>
             );
          })}
        </Grid>
      )}

      {!loading && entries.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10, mb: 4 }}>
          <Pagination
            count={totalPages || 1}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            shape="rounded"
            sx={{
              p: 1.5,
              bgcolor: 'white',
              borderRadius: 4,
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0, 0, 0, 0.05)",
              '& .MuiPaginationItem-root': {
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "#64748b",
                borderRadius: 2.5,
                mx: 0.5,
                transition: "all 0.3s ease",
                '&:hover': {
                  bgcolor: "rgba(99, 102, 241, 0.1)",
                  color: "#6366f1",
                  transform: "translateY(-2px)",
                },
                '&.Mui-selected': {
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "white",
                  boxShadow: "0 6px 15px rgba(99, 102, 241, 0.4)",
                  border: "none",
                  '&:hover': {
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  }
                },
                '&.MuiPaginationItem-ellipsis': {
                  bgcolor: 'transparent',
                  transform: 'none',
                  '&:hover': {
                    bgcolor: 'transparent',
                  }
                }
              }
            }}
          />
        </Box>
      )}
      </Container>
    </Box>
  );
}
