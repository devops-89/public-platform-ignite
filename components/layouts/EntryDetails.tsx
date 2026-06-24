"use client";
import { EntryItem, FormField, LooseObject } from "../../types";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  Rating,
  TextField
} from "@mui/material";
import Breadcrumb from "../widgets/Breadcrumb";
import {
  AccountCircle,
  CalendarToday,
  CheckCircle,
  Download,
  EmojiEvents,
  Info,
  InsertDriveFile,
  Mail,
  Phone,
  Star,
  Tune,
  HowToVote,
} from "@mui/icons-material";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { entryControllers } from "../../api/entryControllers";
import { contestControllers } from "../../api/contestControllers";
import { useSnackbar } from "@/context/SnackbarContext";

const CONTEST_ID = "ae1fb2a4-4da5-44ed-ae85-7fb0659a1ab6";

export default function EntryDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const searchParams = useSearchParams();
  const contestId = searchParams.get("contestId") || CONTEST_ID;
  const { showSnackbar } = useSnackbar();
  
  const [entry, setEntry] = useState<EntryItem | null>(null);
  const [templateFields, setTemplateFields] = useState<FormField[]>([]);
  const [userFields, setUserFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [voteCount, setVoteCount] = useState(0);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState(false);

  useEffect(() => {
    if (id) {
      const hasVoted = localStorage.getItem(`voted_${id}`) === "true";
      setVoted(hasVoted);
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const entryRes = await entryControllers.getEntryById(contestId, id);
        
        let entryData = entryRes?.data || entryRes;
        
        setEntry(entryData);
        setVoteCount(entryData?.voteCount !== undefined ? entryData.voteCount : 0);

        const contestData = entryData?.contest;

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
        console.error("Failed to fetch entry details", error);
      } finally {
        setLoading(false);
      }
    };
    if (id && contestId) {
      fetchData();
    }
  }, [id, contestId]);

  const handleVote = async (commentText: string) => {
    if (!id || !entry) return;
    try {
      setVoting(true);
      const contestId = entry.contest_id || entry.contest?.id || CONTEST_ID;
      const res = await entryControllers.voteForEntry(
        contestId,
        id,
        commentText
      );
      
      setVoteCount((prev: number) => prev + 1);
      setVoted(true);
      localStorage.setItem(`voted_${id}`, "true");
      showSnackbar(res?.message || "Your vote has been recorded successfully!", "success");
    } catch (error: unknown) {
      console.error("Failed to vote", error);
      const err = error as { response?: { status?: number, data?: { message?: string } }, message?: string };
      const errMsg = err.response?.data?.message || err.message || "Failed to submit vote.";
      showSnackbar(errMsg, "error");
      
      if (err.response?.status === 409 || errMsg.toLowerCase().includes("already voted")) {
        setVoted(true);
        localStorage.setItem(`voted_${id}`, "true");
      }
    } finally {
      setVoting(false);
    }
  };

  const handleVoteClick = () => {
    if (!comment.trim()) {
      setCommentError(true);
      return;
    }
    setCommentError(false);
    handleVote(comment.trim());
  };

  const getImageUrl = (dataObj: Record<string, string> | undefined) => {
    if (!dataObj) return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80";
    
    const imageField = templateFields.find((f: FormField) => f.label?.toLowerCase().includes("thumbnail")) 
                    || templateFields.find((f: FormField) => f.type === "image" || f.type === "file_upload" || f.label?.toLowerCase().includes("image") || f.label?.toLowerCase().includes("photo"));
    if (imageField && dataObj[`${imageField.id}_downloadUrl`]) {
      return dataObj[`${imageField.id}_downloadUrl`];
    } else if (imageField && dataObj[imageField.id] && typeof dataObj[imageField.id] === 'string' && dataObj[imageField.id].includes("http")) {
      return dataObj[imageField.id];
    }

    for (const key in dataObj) {
      if (key.includes("downloadUrl") && typeof dataObj[key] === "string") {
        return dataObj[key];
      }
    }
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80";
  };

  const getTitle = (entryObj: EntryItem) => {
    const subData = entryObj?.submission?.data || {};
    let title = "";

    const entryTitleField = templateFields?.find((f: FormField) => {
      const l = f.label?.toLowerCase() || "";
      return l.includes("title") || l.includes("project") || l.includes("name");
    });

    if (entryTitleField) {
      title = subData[entryTitleField.id] || subData[entryTitleField.label];
    }

    if (!title) {
       title = subData["Innovation Title"] || "Participant Entry";
    }
    return title;
  };

  const getAuthor = (entryObj: EntryItem) => {
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

    const rawAuthorData = (entryObj?.participant?.submission?.data || entryObj?.participant?.user || entryObj?.user || entryObj?.author || entryObj?.participant || {}) as LooseObject;
    const authorData = (rawAuthorData?.data || rawAuthorData || (entryObj?.participant as LooseObject)?.data || (entryObj?.participant as LooseObject)?.participant_profile_data || {}) as Record<string, string>;
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
        authorName = authorData.yg9snrxlh || authorData["fullName"] || authorData["name"];
      }
    }

    return authorName || "Anonymous";
  };

  const getFieldIcon = (type: string | undefined, label: string) => {
    const lowercaseLabel = label.toLowerCase();
    if (lowercaseLabel.includes("phone") || lowercaseLabel.includes("mobile") || type === "telInput")
      return <Phone sx={{ fontSize: 20 }} />;
    if (lowercaseLabel.includes("email") || lowercaseLabel.includes("mail"))
      return <Mail sx={{ fontSize: 20 }} />;
    if (lowercaseLabel.includes("date") || lowercaseLabel.includes("dob") || lowercaseLabel.includes("birth") || type === "datePicker")
      return <CalendarToday sx={{ fontSize: 20 }} />;
    if (lowercaseLabel.includes("rating") || type === "rating")
      return <Star sx={{ fontSize: 20 }} />;
    if (lowercaseLabel.includes("score") || lowercaseLabel.includes("points"))
      return <EmojiEvents sx={{ fontSize: 20 }} />;
    if (type === "checkbox" || type === "switch")
      return <CheckCircle sx={{ fontSize: 20 }} />;
    if (type === "slider") return <Tune sx={{ fontSize: 20 }} />;

    if (lowercaseLabel.includes("name") || lowercaseLabel.includes("member") || lowercaseLabel.includes("father"))
      return <AccountCircle sx={{ fontSize: 20 }} />;

    return <Info sx={{ fontSize: 20 }} />;
  };

  const renderFieldValue = (field: FormField) => {
    const { type, value } = field;

    if (value === undefined || value === null || value === "") {
      return (
        <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic", mt: 0.5 }}>
          Not specified
        </Typography>
      );
    }

    if (type === "rating") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
          <Rating value={Number(value)} readOnly precision={0.5} size="small" />
          <Typography variant="caption" sx={{ ml: 1, fontWeight: 600, color: "text.secondary" }}>
            ({String(value)})
          </Typography>
        </Box>
      );
    }

    if (type === "checkbox" || type === "switch") {
      const isTrue = value === true || String(value).toLowerCase() === "true" || value === "Yes";
      return (
        <Chip
          label={isTrue ? "Yes" : "No"}
          size="small"
          sx={{
            mt: 0.5,
            fontWeight: 600,
            fontSize: "0.75rem",
            bgcolor: isTrue ? "rgba(16, 185, 129, 0.1)" : "rgba(100, 116, 139, 0.1)",
            color: isTrue ? "#10b981" : "#64748b",
            border: `1px solid ${isTrue ? "rgba(16, 185, 129, 0.2)" : "rgba(100, 116, 139, 0.2)"}`,
          }}
        />
      );
    }

    if (type === "datePicker") {
      try {
        return (
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", mt: 0.5 }}>
            {new Date(value as string | number).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </Typography>
        );
      } catch (e) {
        return <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", mt: 0.5 }}>{String(value)}</Typography>;
      }
    }

    if (type === "file_upload" || type === "file" || type === "image") {
      if (!value) return null;
      const urlStr = typeof value === 'string' ? value : ((value as Record<string, string>).downloadUrl || String(value));
      const isImage = typeof urlStr === 'string' && urlStr.match(/\.(jpeg|jpg|gif|png|webp)/i);
      
      const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        window.open(urlStr, "_blank");
      };

      return (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: `1px solid #e2e8f0`, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
          {isImage ? (
            <Box sx={{ position: 'relative', width: 60, height: 60, borderRadius: 1, overflow: 'hidden', flexShrink: 0, border: `1px solid #e2e8f0` }}>
              <Image src={urlStr} alt="Uploaded file" fill style={{ objectFit: "cover" }} sizes="60px" />
            </Box>
          ) : (
            <Box sx={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(99, 102, 241, 0.1)', borderRadius: 1, color: "primary.main", flexShrink: 0 }}>
              <InsertDriveFile sx={{ fontSize: 30 }} />
            </Box>
          )}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
             <Typography variant="caption" noWrap sx={{ display: 'block', fontWeight: 600, color: "text.primary" }}>
               {isImage ? "Image File" : "Document File"}
             </Typography>
             <Button variant="outlined" size="small" onClick={handleDownload} startIcon={<Download />} sx={{ mt: 0.5, textTransform: 'none', py: 0.25, px: 1.5, fontSize: '0.75rem', borderRadius: 1.5 }}>
               Download
             </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", wordBreak: "break-word", mt: 0.5 }}>
        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
      </Typography>
    );
  };

  const groupedFields = useMemo(() => {
    if (!entry?.submission?.data) return [];

    const submissionData = entry.submission.data;
    const groups: { title: string; fields: { id: string; label: string; value: unknown; type: string }[] }[] = [];

    let currentGroup = { title: "Information", fields: [] as { id: string; label: string; value: unknown; type: string }[] };
    const mappedFieldIds = new Set<string>();

    const isFirstOrLast = (label: string) => {
      const l = (label || "").toLowerCase().replace(/\s+/g, '');
      return l === "firstname" || l === "lastname" || l === "first" || l === "last";
    };

    // Prepend concatenated Full Name as the first field
    const authorName = getAuthor(entry);
    if (authorName && authorName !== "Anonymous User") {
      currentGroup.fields.push({
        id: "full_name_concat",
        label: "Full Name",
        value: authorName,
        type: "textfield"
      });
    }

    templateFields?.forEach((field: FormField) => {
      if (field.type === "step_break") {
        if (currentGroup.fields.length > 0 || currentGroup.title !== "Information") {
          groups.push(currentGroup);
        }
        currentGroup = { title: field.label, fields: [] };
      } else {
        if (isFirstOrLast(field.label)) {
          // Skip individual first/last name fields
          return;
        }
        if ((field.label || "").toLowerCase().includes("thumbnail")) {
          // Skip thumbnail fields as they are already shown in the hero image
          return;
        }
        const labelTrimmed = field.label?.trim() || "";
        const downloadUrl = submissionData[`${labelTrimmed}_downloadUrl`] || submissionData[`${field.label}_downloadUrl`] || submissionData[`${field.id}_downloadUrl`];
        const value = downloadUrl || submissionData[labelTrimmed] || submissionData[field.label] || submissionData[field.id];
        currentGroup.fields.push({
          id: field.id,
          label: field.label,
          value: value !== undefined ? value : "",
          type: field.type || "",
        });
        mappedFieldIds.add(field.id);
      }
    });

    if (currentGroup.fields.length > 0 || currentGroup.title !== "Information") {
      groups.push(currentGroup);
    }

    const mappedFieldKeys = new Set<string>();
    templateFields?.forEach((f: FormField) => {
      mappedFieldKeys.add(f.id);
      mappedFieldKeys.add(f.label);
      if (f.label) mappedFieldKeys.add(f.label.trim());
    });



    return groups.filter((g) => g.fields.some((f) => f.value !== "" && f.value !== null && f.value !== undefined));
  }, [entry?.submission?.data, templateFields, getAuthor]);

  if (loading) {
    return (
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!entry) {
    return (
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h5">Entry not found</Typography>
        <Button variant="outlined" onClick={() => router.back()} sx={{ mt: 2 }}>Back to Gallery</Button>
      </Container>
    );
  }

  const subData = entry?.submission?.data || {};

  return (
    <Container sx={{ py: 6 }} maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Breadcrumb
          title="Entry Details"
          data={[
            { title: "Gallery", href: "/gallery" },
            { title: "Details", href: "#" },
          ]}
        />
      </Box>
      
      <Paper 
        elevation={0} 
        sx={{ 
          overflow: "hidden", 
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)"
        }}
      >
        <Box
          sx={{
            height: 400,
            backgroundImage: `url(${getImageUrl(subData)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <Box sx={{ p: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h3" component="h1" fontWeight="800" sx={{ letterSpacing: "-0.02em" }} gutterBottom>
                {getTitle(entry)}
              </Typography>
              <Typography variant="h6" sx={{ color: "text.secondary", fontWeight: 500 }}>
                By {getAuthor(entry)}
              </Typography>
            </Box>
            <Chip label={entry.status || "Pending"} color="primary" sx={{ textTransform: "capitalize", px: 1, fontSize: '1rem' }} />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Grid container spacing={4}>
            <Grid size={{xs:12,md:8}}>
              {groupedFields.map((group, gIdx) => (
                <Box key={gIdx} sx={{ mb: 5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <Box sx={{ width: 4, height: 24, borderRadius: 1, bgcolor: "primary.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                      {group.title}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", bgcolor: "background.paper", borderRadius: 3, border: `1px solid #e2e8f0`, p: 1 }}>
                    {group.fields.map((field: FormField, idx: number) => (
                      <Box
                        key={field.id}
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "flex-start", sm: "center" },
                          py: 2.5,
                          borderBottom: idx === group.fields.length - 1 ? 'none' : `1px dashed #e2e8f0`,
                          "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                          px: { xs: 2, sm: 3 },
                          borderRadius: 2,
                          gap: { xs: 1, sm: 0 },
                          transition: "background-color 0.2s ease"
                        }}
                      >
                        <Box sx={{ width: { xs: "100%", sm: "40%" }, display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 1, borderRadius: 2, bgcolor: "rgba(99, 102, 241, 0.05)", color: "primary.main" }}>
                            {getFieldIcon(field.type, field.label)}
                          </Box>
                          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: 0.5 }}>
                            {field.label}
                          </Typography>
                        </Box>
                        <Box sx={{ width: { xs: "100%", sm: "60%" }, pl: { xs: 0, sm: 2 }, pt: { xs: 1, sm: 0 } }}>
                          {renderFieldValue(field)}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Grid>
            <Grid size={{xs:12,md:4}}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Box sx={{ width: 4, height: 24, borderRadius: 1, bgcolor: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                  Action
                </Typography>
              </Box>
              <Paper 
                elevation={0}
                variant="outlined" 
                sx={{ 
                  p: 4, 
                  textAlign: "center", 
                  bgcolor: "background.paper", 
                  position: "sticky", 
                  top: 24, 
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)"
                }}
              >
                <Box sx={{ display: "inline-flex", p: 1.5, borderRadius: "50%", bgcolor: "rgba(99, 102, 241, 0.1)", color: "primary.main", mb: 2 }}>
                  <HowToVote sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h5" color="text.primary" fontWeight="bold" gutterBottom>
                  Cast Your Vote
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Your support comment will register your vote.
                </Typography>
                
                <Divider sx={{ my: 3 }} />

                {!voted && (
                  <TextField
                    label="Add a Comment to Vote"
                    placeholder="Enter your support comment..."
                    multiline
                    rows={3}
                    fullWidth
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      if (e.target.value.trim()) setCommentError(false);
                    }}
                    error={commentError}
                    helperText={commentError ? "Please enter a support comment to vote." : ""}
                    disabled={voting}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        bgcolor: "background.paper",
                      }
                    }}
                  />
                )}

                <Button 
                  variant="contained" 
                  fullWidth 
                  size="large" 
                  disabled={voted || voting}
                  onClick={handleVoteClick}
                  sx={{ 
                    py: 1.75, 
                    textTransform: "none", 
                    fontWeight: 700, 
                    fontSize: "1.1rem",
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 15px 30px -5px rgba(99, 102, 241, 0.5)",
                    }
                  }}
                >
                  {voting ? <CircularProgress size={24} color="inherit" /> : (voted ? "Voted Successfully!" : "Submit Comment & Vote")}
                </Button>
                {voted && (
                  <Typography variant="body2" color="success.main" sx={{ display: "block", mt: 2, fontWeight: 700 }}>
                    Thank you for your support and vote!
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Global snackbar is used instead */}
    </Container>
  );
}
