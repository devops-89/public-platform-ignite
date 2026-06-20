"use client";

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { entryControllers } from "../../api/entryControllers";
import { contestControllers } from "../../api/contestControllers";

export default function Gallery() {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [templateFields, setTemplateFields] = useState<any[]>([]);
  const [userFields, setUserFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const CONTEST_ID = "ae1fb2a4-4da5-44ed-ae85-7fb0659a1ab6";

  useEffect(() => {
    const fetchEntriesAndFields = async () => {
      try {
        setLoading(true);
        const entriesRes = await entryControllers.getAllEntries(CONTEST_ID);
        
        let docs = [];
        if (entriesRes?.data?.docs) {
          docs = entriesRes.data.docs;
        } else if (entriesRes?.docs) {
          docs = entriesRes.docs;
        }
        
        // Filter entries locally by the contest ID
        docs = docs.filter(
          (e: any) => e.contest_id === CONTEST_ID || e.contest?.id === CONTEST_ID
        );
        
        setEntries(docs);

        const firstEntry = docs[0];
        const contestData = firstEntry?.contest;

        let tFields: any[] = [];
        let uFields: any[] = [];
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
    fetchEntriesAndFields();
  }, []);

  const getImageUrl = (dataObj: any) => {
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

  const getTitle = (entry: any) => {
    const subData = entry?.submission?.data || {};
    let title = "";

    const entryTitleField = templateFields?.find((f: any) => {
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

  const getAuthor = (entry: any) => {
    const firstNameField = userFields.find((f: any) => {
      const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
      return l.includes("firstname") || l === "first";
    });
    const lastNameField = userFields.find((f: any) => {
      const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
      return l.includes("lastname") || l === "last";
    });
    const fullNameField = userFields.find((f: any) => {
      const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
      return l.includes("fullname") || l === "name" || (l.includes("name") && !l.includes("first") && !l.includes("last"));
    });

    const rawAuthorData = entry?.participant?.submission?.data || entry?.participant?.user || entry?.user || entry?.author || entry?.participant || {};
    const authorData = rawAuthorData?.data || rawAuthorData || (entry?.participant as any)?.data || (entry?.participant as any)?.participant_profile_data || {};
    let authorName = "";

    if (firstNameField || lastNameField) {
      const first = firstNameField ? (authorData[firstNameField.label] || authorData[firstNameField.id]) : "";
      const last = lastNameField ? (authorData[lastNameField.label] || authorData[lastNameField.id]) : "";
      authorName = `${first || ""} ${last || ""}`.trim();
    }
    
    if (!authorName && fullNameField) {
      authorName = authorData[fullNameField.label] || authorData[fullNameField.id];
    }

    if (!authorName) {
      const fallback = userFields.find((f: any) => f.label?.toLowerCase().includes("name"));
      if (fallback && (authorData[fallback.label] || authorData[fallback.id])) {
        authorName = authorData[fallback.label] || authorData[fallback.id];
      } else {
        authorName = authorData.yg9snrxlh || authorData["fullName"] || authorData["name"] || authorData["firstName"] || entry?.author_name || entry?.participant_name || entry?.participant?.name || entry?.user?.name;
      }
    }

    return authorName || "Anonymous";
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Animated Hero Section */}
      <Box
        sx={{
          position: 'relative',
          background: 'linear-gradient(-45deg, #4f46e5, #7c3aed, #ec4899, #3b82f6)',
          backgroundSize: '400% 400%',
          animation: 'gradientBG 15s ease infinite',
          color: 'white',
          py: { xs: 10, md: 16 },
          px: 3,
          textAlign: 'center',
          overflow: 'hidden',
          '@keyframes gradientBG': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
        }}
      >
        {/* Animated Floating Orb 1 */}
        <Box
          sx={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "50%",
            height: "150%",
            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)",
            transform: "rotate(30deg)",
            animation: "float 8s ease-in-out infinite",
            '@keyframes float': {
              '0%': { transform: 'rotate(30deg) translateY(0px)' },
              '50%': { transform: 'rotate(30deg) translateY(-30px)' },
              '100%': { transform: 'rotate(30deg) translateY(0px)' },
            }
          }}
        />
        {/* Animated Floating Orb 2 */}
        <Box
          sx={{
            position: "absolute",
            bottom: "-30%",
            right: "-10%",
            width: "40%",
            height: "120%",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)",
            transform: "rotate(-15deg)",
            animation: "floatAlt 10s ease-in-out infinite",
            '@keyframes floatAlt': {
              '0%': { transform: 'rotate(-15deg) translateY(0px)' },
              '50%': { transform: 'rotate(-15deg) translateY(40px)' },
              '100%': { transform: 'rotate(-15deg) translateY(0px)' },
            }
          }}
        />
        
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              p: { xs: 4, md: 6 },
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
              }
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{ 
                fontWeight: 800, 
                mb: 2, 
                letterSpacing: "-0.03em", 
                fontSize: { xs: "2.5rem", md: "4.5rem" },
                textShadow: "0 2px 10px rgba(0,0,0,0.2)"
              }}
            >
              Voting Gallery
            </Typography>
            <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 400, maxWidth: 600, mx: "auto", lineHeight: 1.6 }}>
              Explore amazing semifinal entries and cast your vote for the best innovations that shape our future.
            </Typography>
          </Box>
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
                     <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
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
      </Container>
    </Box>
  );
}
