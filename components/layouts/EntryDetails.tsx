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
  PlayCircleOutline
} from "@mui/icons-material";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { entryControllers } from "../../api/entryControllers";
import { contestControllers } from "../../api/contestControllers";
import { useSnackbar } from "@/context/SnackbarContext";

const CONTEST_ID = "ae1fb2a4-4da5-44ed-ae85-7fb0659a1ab6";

const VideoPlayerBox = ({ url, label }: { url: string, label: string }) => {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <Box sx={{ width: '100%', maxWidth: 500, borderRadius: 2, overflow: 'hidden', bgcolor: 'black', aspectRatio: '16/9', mt: 1 }}>
        <video src={url} controls autoPlay style={{ width: '100%', height: '100%' }} />
      </Box>
    );
  }

  return (
    <Box 
      onClick={() => setPlaying(true)}
      sx={{ 
        width: '100%',
        maxWidth: 500, 
        aspectRatio: '16/9', 
        bgcolor: '#000',
        border: '1px solid #e2e8f0', 
        borderRadius: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        mt: 1,
        overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
        },
        '&:hover .play-icon': {
          transform: 'scale(1.1)',
          color: 'primary.main'
        }
      }}
    >
      <video 
        src={`${url}#t=0.1`} 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} 
        preload="metadata"
      />
      <PlayCircleOutline className="play-icon" sx={{ fontSize: 64, color: 'white', zIndex: 1, transition: 'all 0.2s ease' }} />
      <Typography variant="caption" sx={{ position: 'absolute', bottom: 8, right: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, zIndex: 1 }}>
        Play Video
      </Typography>
    </Box>
  );
};

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

  const { videoField, innovationFields } = useMemo<{
    videoField: { label: string; url: string } | null;
    innovationFields: { label: string; value: string }[];
  }>(() => {
    if (!entry?.submission?.data || !templateFields) return { videoField: null, innovationFields: [] };
    const subData = entry.submission.data;
    
    let videoField: { label: string, url: string } | null = null;
    const innovationFields: { label: string; value: string }[] = [];
    let inInnovationSection = false;

    templateFields.forEach((field: FormField) => {
      if (field.type === "step_break") {
        if ((field.label || "").toLowerCase().includes("innovation details")) {
          inInnovationSection = true;
        } else {
          inInnovationSection = false;
        }
        return;
      }

      const labelTrimmed = field.label?.trim() || "";
      const downloadUrl = subData[`${labelTrimmed}_downloadUrl`] || subData[`${field.label}_downloadUrl`] || subData[`${field.id}_downloadUrl`];
      const value = downloadUrl || subData[labelTrimmed] || subData[field.label] || subData[field.id];

      if (!value) return;

      // Check for video
      const isVideo = typeof value === 'string' && value.match(/\.(mp4|mov|mkv|webm|ogg)/i);
      if (isVideo && !videoField) {
        videoField = { label: field.label, url: value as string };
      }

      if (inInnovationSection) {
        // Exclude links
        if (typeof value === 'string' && value.match(/^https?:\/\//i)) {
          return;
        }
        innovationFields.push({ label: field.label, value: String(value) });
      }
    });

    return { videoField, innovationFields };
  }, [entry, templateFields]);

  const isVotingEnded = useMemo(() => {
    if (!entry?.contest) return false;
    
    let endDateStr = (entry.contest as any).public_voting_end_date || (entry.contest as any).publicVotingEndDate || (entry.contest as any).end_date;
    
    const votingPeriods = (entry.contest as any).votingPeriods || (entry as any).votingPeriods;
    if (Array.isArray(votingPeriods)) {
      const publicPeriod = votingPeriods.find((p: any) => p.voting_type === "PUBLIC");
      if (publicPeriod && publicPeriod.end_date) {
        endDateStr = publicPeriod.end_date;
      }
    }

    if (!endDateStr) return false;
    return new Date() > new Date(endDateStr);
  }, [entry]);

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
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)"
        }}
      >
        <Box
          sx={{
            height: 400,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
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
            <Grid size={{xs:12,md: isVotingEnded ? 12 : 8}}>
              {/* Video Section */}
              {videoField && (
                <Box sx={{ mb: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <Box sx={{ width: 4, height: 24, borderRadius: 1, bgcolor: "primary.main" }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
                      Innovation Video
                    </Typography>
                  </Box>
                  <VideoPlayerBox url={videoField.url} label={videoField.label} />
                </Box>
              )}

              {/* Innovation Details Section */}
              {innovationFields.length > 0 && (
                <Box sx={{ mb: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
                    <Box sx={{ width: 4, height: 24, borderRadius: 1, bgcolor: "primary.main" }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
                      Innovation Details
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {innovationFields.map((field, idx) => (
                      <Box key={idx} sx={{ bgcolor: 'rgba(0,0,0,0.02)', p: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, mb: 2, lineHeight: 1.4 }}>
                          {field.label}
                        </Typography>
                        <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>
                          {field.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
            {!isVotingEnded && (
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
                  top: 100, 
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
                  zIndex: 10
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
            )}
          </Grid>
        </Box>
      </Paper>
      
      {/* Global snackbar is used instead */}
    </Container>
  );
}
