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
  History
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
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  
  const [selectedPrior, setSelectedPrior] = useState<PriorStudy | null>(null);
  
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
    setShowReturnDialog(false);
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
                <span className="font-mono text-sm font-medium">{study.id}</span>
                <StatusBadge status={study.status} />
                <UrgencyBadge urgency={study.urgency} />
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>{study.patientId}</span>
                <span>{study.modality} {study.bodyArea}</span>
                <span>{study.sex}/{study.age}y</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DeadlineTimer deadline={study.deadline} />
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              DICOM
            </Button>
          </div>
        </div>
      </header>

      {/* Returned Warning */}
      {isReturned && (
        <div className="mx-4 mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Returned for Revision</p>
              <p className="text-sm text-muted-foreground mt-1">
                "Please add comparison with prior abdominal US from 2023."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clinical & Technical Notes - Important Context */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-4">
        <div className="clinical-card border-l-4 border-l-primary">
          <div className="clinical-card-header">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Clinical Notes
            </h3>
          </div>
          <div className="clinical-card-body">
            <p className="text-sm text-foreground">
              Patient presents with persistent cough for 3 weeks. History of smoking (20 pack-years). 
              Rule out pulmonary pathology.
            </p>
          </div>
        </div>
        <div className="clinical-card border-l-4 border-l-muted-foreground">
          <div className="clinical-card-header">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Technical Notes
            </h3>
          </div>
          <div className="clinical-card-body">
            <p className="text-sm text-foreground">
              Study performed on Siemens SOMATOM Definition Edge. 
              Slice thickness: 1.5mm. kVp: 120. Motion artifact present - limited evaluation of bases.
            </p>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content - Report Editor */}
        <div className={cn("flex-1 p-6", selectedPrior && "border-r border-border")}>
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-primary">Current Report</span>
              <span className="text-xs text-muted-foreground font-mono">{study.id}</span>
            </div>
            
            {/* Study Protocol */}
            <div>
              <label className="field-label">Study Protocol</label>
              <textarea
                className="report-textarea"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                placeholder="Describe the imaging technique and protocol used..."
                readOnly={study.status === 'finalized' || study.status === 'delivered'}
              />
            </div>

            {/* Findings */}
            <div>
              <label className="field-label">Findings</label>
              <textarea
                className="report-textarea min-h-[200px]"
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Document all imaging findings in detail..."
                readOnly={study.status === 'finalized' || study.status === 'delivered'}
              />
            </div>

            {/* Impression */}
            <div>
              <label className="field-label">Impression</label>
              <textarea
                className="report-textarea"
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                placeholder="Provide a summary interpretation and recommendations..."
                readOnly={study.status === 'finalized' || study.status === 'delivered'}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {isValidator ? (
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setShowReturnDialog(true)}>
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
          </div>
        </div>

        {/* Prior Study Comparison Panel */}
        {selectedPrior && (
          <div className="flex-1 p-6 bg-muted/20">
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">Prior Report</span>
                  <span className="text-xs text-muted-foreground">{selectedPrior.type} • {selectedPrior.date}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPrior(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Prior Protocol */}
              <div>
                <label className="field-label text-muted-foreground">Study Protocol</label>
                <div className="report-textarea bg-muted/50 min-h-[100px]">
                  <p className="text-sm text-muted-foreground italic">Protocol not available for prior studies</p>
                </div>
              </div>

              {/* Prior Findings */}
              <div>
                <label className="field-label text-muted-foreground">Findings</label>
                <div className="report-textarea bg-muted/50 min-h-[200px]">
                  <p className="text-sm">{selectedPrior.reportText}</p>
                </div>
              </div>

              {/* Prior Impression */}
              <div>
                <label className="field-label text-muted-foreground">Impression</label>
                <div className="report-textarea bg-muted/50 min-h-[100px]">
                  <p className="text-sm text-muted-foreground italic">See findings above</p>
                </div>
              </div>

              {/* Download button */}
              <div className="pt-4 border-t border-border">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download DICOM
                </Button>
              </div>
            </div>
          </div>
        )}

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
                    onClick={() => handlePriorClick(prior)}
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

      {/* Submit Confirmation Dialog */}
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

      {/* Return for Revision Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return for Revision</DialogTitle>
            <DialogDescription>
              Please provide a comment explaining what needs to be revised.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="field-label">Comment (required)</label>
            <Textarea
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              placeholder="Explain what changes are needed..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
            <Button onClick={handleReturn} disabled={!returnComment.trim()}>
              Return to Physician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
