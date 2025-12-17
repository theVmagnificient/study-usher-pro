import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  Save, 
  Send, 
  ChevronRight,
  FileText,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  RotateCcw,
  Link2,
  X,
  History,
  User,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { DeadlineTimer } from "@/components/ui/DeadlineTimer";
import { mockStudies, mockPriorStudies } from "@/data/mockData";
import { getLinkedStudies } from "@/components/ui/LinkedStudiesBadge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type { PriorStudy } from "@/types/study";


export function ReportingPage() {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const study = mockStudies.find(s => s.id === studyId) || mockStudies[0];
  const linkedStudies = getLinkedStudies(study, mockStudies);
  
  const [protocol, setProtocol] = useState("Non-contrast CT of the chest was performed using standard departmental protocol.");
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  
  const [selectedPrior, setSelectedPrior] = useState<PriorStudy | null>(null);
  const [showEnglishTranslation, setShowEnglishTranslation] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [validatorComment, setValidatorComment] = useState("");
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [returnedExpanded, setReturnedExpanded] = useState(true);

  // English translations (auto-generated from Russian report, editable)
  const [englishProtocol, setEnglishProtocol] = useState("Non-contrast CT of the chest was performed using standard departmental protocol. Slice thickness 1.5mm with iterative reconstruction.");
  const [englishFindings, setEnglishFindings] = useState("The lungs are clear bilaterally without evidence of consolidation, masses, or nodules. No pleural effusion identified. The mediastinal structures are within normal limits. Heart size is normal. No lymphadenopathy. The visualized portions of the upper abdomen are unremarkable.");
  const [englishImpression, setEnglishImpression] = useState("Normal chest CT examination. No acute cardiopulmonary process identified. Follow-up imaging is not indicated based on current findings.");

  const clinicalNotesText = `Patient presents with persistent cough for 3 weeks, productive of yellowish sputum. History of smoking (20 pack-years), quit 2 years ago. Reports occasional dyspnea on exertion and mild chest discomfort. No hemoptysis. No fever or night sweats reported. Family history significant for lung cancer (father, diagnosed age 62). Previous chest X-ray from 6 months ago showed no significant abnormalities. Patient currently on ACE inhibitor for hypertension - consider ACE inhibitor-induced cough in differential. Weight loss of 5kg over past 2 months noted. Rule out pulmonary pathology including malignancy given risk factors.`;

  const technicalNotesText = `Study performed on Siemens SOMATOM Definition Edge (128-slice). Acquisition parameters: Slice thickness 1.5mm, reconstruction interval 1.0mm. kVp: 120, mAs: 180 (with tube current modulation enabled). Non-contrast examination per protocol. Pitch factor: 1.2. Scan range from lung apices to adrenal glands. Iterative reconstruction (SAFIRE strength 3) applied. Motion artifact present at lung bases - limited evaluation of lower lobes, recommend clinical correlation if persistent symptoms. Streak artifact from patient arms noted but does not significantly impact diagnostic quality. Total DLP: 385 mGy·cm. Effective dose estimate: 5.4 mSv. Images reviewed on Syngo.via workstation.`;

  const isValidator = ['draft-ready', 'under-validation'].includes(study.status);
  const isReturned = study.status === 'returned';

  const handleBack = () => navigate(-1);
  
  const handleSaveDraft = () => {
    // Visual feedback only
  };
  
  const handleSubmit = () => {
    setShowSubmitDialog(false);
    navigate(-1);
  };

  const handleApprove = () => {
    navigate(-1);
  };

  const handleReturn = () => {
    navigate(-1);
  };

  const handlePriorClick = (prior: PriorStudy) => {
    setSelectedPrior(selectedPrior?.id === prior.id ? null : prior);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">{study.id}</span>
                <StatusBadge status={study.status} />
                <UrgencyBadge urgency={study.urgency} />
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-muted-foreground">{study.patientId}</span>
                <span className="text-base font-semibold text-foreground">{study.modality} {study.bodyArea}</span>
                <span className="text-base font-medium text-foreground">{study.sex}/{study.age}y</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DeadlineTimer deadline={study.deadline} />
            {linkedStudies.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    DICOM
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Download {study.bodyArea} only
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Download all ({linkedStudies.length + 1} body parts)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                DICOM
              </Button>
            )}
          </div>
        </div>
      </header>


      {/* Comments - Collapsible Section at Top */}
      {study.validatorComments && study.validatorComments.length > 0 && (
        <div className="mx-4 mt-4">
          <button
            onClick={() => setCommentsExpanded(!commentsExpanded)}
            className="w-full clinical-card border-l-4 border-l-muted-foreground bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer text-left"
          >
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                Comments
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({study.validatorComments.length} comment{study.validatorComments.length !== 1 ? 's' : ''})
                </span>
              </h3>
              {commentsExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            {!commentsExpanded && (
              <div className="clinical-card-body">
                <p className="text-sm text-foreground line-clamp-1">
                  {study.validatorComments[0].text}
                </p>
              </div>
            )}
          </button>
          {commentsExpanded && (
            <div className="mt-2 space-y-2">
              {study.validatorComments.map((comment) => {
                const commentDate = new Date(comment.timestamp);
                const formattedDate = commentDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });
                const formattedTime = commentDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <div
                    key={comment.id}
                    className={cn(
                      "clinical-card border-l-4",
                      comment.isCritical 
                        ? "border-l-destructive bg-destructive/5" 
                        : "border-l-yellow-500 bg-yellow-500/5"
                    )}
                  >
                    <div className="clinical-card-body">
                      <p className="text-sm text-foreground">{comment.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          — {comment.validatorName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formattedDate} at {formattedTime}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Clinical & Technical Notes - Important Context */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-4">
        <button
          onClick={() => setNotesExpanded(!notesExpanded)}
          className="clinical-card border-l-4 border-l-primary text-left w-full hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <div className="clinical-card-header">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Clinical Notes
            </h3>
            {notesExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="clinical-card-body">
            <p className={cn(
              "text-sm text-foreground transition-all",
              !notesExpanded && "line-clamp-2"
            )}>
              {clinicalNotesText}
            </p>
          </div>
        </button>
        <button
          onClick={() => setNotesExpanded(!notesExpanded)}
          className="clinical-card border-l-4 border-l-muted-foreground text-left w-full hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <div className="clinical-card-header">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Technical Notes
            </h3>
            {notesExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="clinical-card-body">
            <p className={cn(
              "text-sm text-foreground transition-all",
              !notesExpanded && "line-clamp-2"
            )}>
              {technicalNotesText}
            </p>
          </div>
        </button>
      </div>

      <div className="flex">
        {/* Main Content - Report Editor */}
        {/* Main Content - Report Editor */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            {/* Headers Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">Current Report</span>
                <span className="text-xs text-muted-foreground font-mono">{study.id}</span>
              </div>
              {(selectedPrior || showEnglishTranslation) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showEnglishTranslation ? (
                      <>
                        <Languages className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">English Translation</span>
                        <span className="text-xs text-muted-foreground">Auto-generated</span>
                      </>
                    ) : (
                      <>
                        <History className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">Prior Report</span>
                        <span className="text-xs text-muted-foreground">{selectedPrior?.type} • {selectedPrior?.date}</span>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => showEnglishTranslation ? setShowEnglishTranslation(false) : setSelectedPrior(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Study Protocol Row */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="field-label">Study Protocol</label>
                <textarea
                  className="report-textarea"
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  placeholder="Describe the imaging technique and protocol used..."
                  readOnly={isValidator || study.status === 'finalized' || study.status === 'delivered'}
                />
              </div>
              {showEnglishTranslation && (
                <div>
                  <label className="field-label text-blue-600 dark:text-blue-400">Study Protocol (EN)</label>
                  <textarea
                    className="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                    value={englishProtocol}
                    onChange={(e) => setEnglishProtocol(e.target.value)}
                    readOnly={study.status === 'finalized' || study.status === 'delivered'}
                  />
                </div>
              )}
              {selectedPrior && !showEnglishTranslation && (
                <div>
                  <label className="field-label text-muted-foreground">Study Protocol</label>
                  <div className="report-textarea bg-muted/50">
                    <p className="text-sm text-muted-foreground italic">Protocol not available for prior studies</p>
                  </div>
                </div>
              )}
            </div>

            {/* Findings Row */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="field-label">Findings</label>
                <textarea
                  className="report-textarea"
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Document all imaging findings in detail..."
                  readOnly={isValidator || study.status === 'finalized' || study.status === 'delivered'}
                />
              </div>
              {showEnglishTranslation && (
                <div>
                  <label className="field-label text-blue-600 dark:text-blue-400">Findings (EN)</label>
                  <textarea
                    className="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                    value={englishFindings}
                    onChange={(e) => setEnglishFindings(e.target.value)}
                    readOnly={study.status === 'finalized' || study.status === 'delivered'}
                  />
                </div>
              )}
              {selectedPrior && !showEnglishTranslation && (
                <div>
                  <label className="field-label text-muted-foreground">Findings</label>
                  <div className="report-textarea bg-muted/50">
                    <p className="text-sm">{selectedPrior.reportText}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Impression Row */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="field-label">Impression</label>
                <textarea
                  className="report-textarea"
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  placeholder="Provide a summary interpretation and recommendations..."
                  readOnly={isValidator || study.status === 'finalized' || study.status === 'delivered'}
                />
              </div>
              {showEnglishTranslation && (
                <div>
                  <label className="field-label text-blue-600 dark:text-blue-400">Impression (EN)</label>
                  <textarea
                    className="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                    value={englishImpression}
                    onChange={(e) => setEnglishImpression(e.target.value)}
                    readOnly={study.status === 'finalized' || study.status === 'delivered'}
                  />
                </div>
              )}
              {selectedPrior && !showEnglishTranslation && (
                <div>
                  <label className="field-label text-muted-foreground">Impression</label>
                  <div className="report-textarea bg-muted/50">
                    <p className="text-sm text-muted-foreground italic">See findings above</p>
                  </div>
                </div>
              )}
            </div>

            {/* Validator Comment Input Section - for validators */}
            {isValidator && (
              <div className="clinical-card border-l-4 border-l-amber-500 bg-amber-500/10 dark:bg-amber-500/20">
                <div className="clinical-card-header">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <MessageCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Add Validator Comment
                  </h3>
                  <span className="text-xs text-muted-foreground">Optional feedback for the reporting radiologist</span>
                </div>
                <div className="clinical-card-body">
                  <textarea
                    className="report-textarea bg-background"
                    value={validatorComment}
                    onChange={(e) => setValidatorComment(e.target.value)}
                    placeholder="Leave a comment about the report quality, suggestions for improvement, or positive feedback..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between pt-4 border-t border-border">
                {isValidator ? (
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleReturn}
                      disabled={!validatorComment.trim()}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Return for Revision
                    </Button>
                    <Button onClick={handleApprove}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalize Report
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleSaveDraft}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button onClick={() => setShowSubmitDialog(true)}>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Validation
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {study.status === 'finalized' || study.status === 'delivered' 
                    ? 'This report is finalized and cannot be edited'
                    : 'Changes are not auto-saved'}
                </p>
              </div>
              {(selectedPrior || showEnglishTranslation) && (
                <div className="pt-4 border-t border-border">
                  {selectedPrior && (
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download DICOM
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Supporting Info */}
        <aside className="w-72 border-l border-border bg-muted/30 p-4 space-y-4 flex-shrink-0">
          {/* Linked Body Parts (Multi-Zone) */}
          {linkedStudies.length > 0 && (
            <div className="clinical-card border-primary/30 bg-primary/5">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  Linked Body Parts
                </h3>
                <span className="text-xs text-muted-foreground">{linkedStudies.length + 1} zones</span>
              </div>
              <div className="divide-y divide-border">
                {/* Current study */}
                <div className="p-3 bg-primary/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{study.bodyArea}</p>
                      <p className="text-xs text-muted-foreground font-mono">{study.id}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">Current</span>
                  </div>
                </div>
                {/* Linked studies */}
                {linkedStudies.map((linked) => (
                  <button
                    key={linked.id}
                    onClick={() => navigate(`/report/${linked.id}`)}
                    className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{linked.bodyArea}</p>
                        <p className="text-xs text-muted-foreground font-mono">{linked.id}</p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded font-medium",
                        linked.status === 'finalized' || linked.status === 'delivered' 
                          ? "bg-status-finalized/20 text-status-finalized"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {linked.status.replace('-', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* English Translation Toggle - Only for validators */}
          {isValidator && (
            <div className="clinical-card border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Languages className="w-4 h-4 text-blue-500" />
                  Translation
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowEnglishTranslation(!showEnglishTranslation);
                  if (!showEnglishTranslation) setSelectedPrior(null);
                }}
                className={cn(
                  "w-full p-3 text-left transition-colors flex items-center justify-between",
                  showEnglishTranslation 
                    ? "bg-blue-500/10 dark:bg-blue-500/20 border-l-2 border-l-blue-500" 
                    : "hover:bg-muted/50"
                )}
              >
                <div>
                  <p className="text-sm font-medium">English Version</p>
                  <p className="text-xs text-muted-foreground">Auto-generated from Russian</p>
                </div>
                {showEnglishTranslation ? (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Viewing</span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          )}

          {/* Prior Studies */}
          {study.hasPriors && (
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">Prior Studies</h3>
                <span className="text-xs text-muted-foreground">{mockPriorStudies.length}</span>
              </div>
              <div className="divide-y divide-border">
                {mockPriorStudies.map((prior) => (
                  <button
                    key={prior.id}
                    onClick={() => {
                      handlePriorClick(prior);
                      if (selectedPrior?.id !== prior.id) setShowEnglishTranslation(false);
                    }}
                    className={cn(
                      "w-full p-3 text-left transition-colors flex items-center justify-between",
                      selectedPrior?.id === prior.id 
                        ? "bg-primary/10 border-l-2 border-l-primary" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">{prior.type}</p>
                      <p className="text-xs text-muted-foreground">{prior.date}</p>
                    </div>
                    {selectedPrior?.id === prior.id ? (
                      <span className="text-xs text-primary font-medium">Viewing</span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </aside>
      </div>

      {/* Patient Summary Panel - Bottom Right */}
      <div className="fixed bottom-4 right-4 w-80 bg-card border border-border rounded-lg shadow-lg z-20">
        <button
          onClick={() => setSummaryExpanded(!summaryExpanded)}
          className="w-full p-3 flex items-center justify-between bg-primary/5 rounded-t-lg hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Patient Summary</span>
            <span className="text-xs text-muted-foreground">{study.patientId}</span>
          </div>
          {summaryExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        {summaryExpanded && (
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {/* Demographics */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Demographics</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Sex:</span>
                  <span className="ml-1 font-medium">{study.sex === 'M' ? 'Male' : 'Female'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Age:</span>
                  <span className="ml-1 font-medium">{study.age} years</span>
                </div>
              </div>
            </div>

            {/* Current Study */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current Study</h4>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Type:</span> <span className="font-medium">{study.modality} {study.bodyArea}</span></p>
                <p><span className="text-muted-foreground">Client:</span> <span className="font-medium">{study.clientName}</span></p>
              </div>
            </div>

            {/* Clinical History */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Clinical History</h4>
              <p className="text-sm">
                Persistent cough for 3 weeks. History of smoking (20 pack-years). Rule out pulmonary pathology.
              </p>
            </div>

            {/* Prior Studies Summary */}
            {study.hasPriors && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Prior Imaging ({mockPriorStudies.length})
                </h4>
                <div className="space-y-2">
                  {mockPriorStudies.map((prior) => (
                    <div key={prior.id} className="text-sm p-2 bg-muted/50 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{prior.type}</span>
                        <span className="text-xs text-muted-foreground">{prior.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{prior.reportText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Findings from Priors */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Points</h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>No acute cardiopulmonary findings on prior CT</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Clear lungs on prior chest X-ray</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>Normal abdominal organs on prior CT</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Validation</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this report for validation? 
              You will not be able to edit the report after it has been finalized by the validator.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted/50 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-urgency-urgent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Please verify you have addressed all relevant body areas and prior studies before submitting.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Confirm Submission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
