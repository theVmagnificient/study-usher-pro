import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  Save, 
  Send, 
  ChevronDown, 
  ChevronRight,
  FileText,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { DeadlineTimer } from "@/components/ui/DeadlineTimer";
import { mockStudies, mockPriorStudies } from "@/data/mockData";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function ReportingPage() {
  const { studyId } = useParams();
  const navigate = useNavigate();
  
  const study = mockStudies.find(s => s.id === studyId) || mockStudies[0];
  
  const [protocol, setProtocol] = useState("Non-contrast CT of the chest was performed using standard departmental protocol.");
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  
  const [clinicalNotesOpen, setClinicalNotesOpen] = useState(false);
  const [techNotesOpen, setTechNotesOpen] = useState(false);
  const [expandedPrior, setExpandedPrior] = useState<string | null>(null);
  
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

      <div className="flex">
        {/* Main Content - Report Editor */}
        <div className="flex-1 p-6">
          <div className="max-w-3xl space-y-6">
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

        {/* Right Sidebar - Supporting Info */}
        <aside className="w-80 border-l border-border bg-muted/30 p-4 space-y-4">
          {/* Prior Studies */}
          {study.hasPriors && (
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">Prior Studies</h3>
                <span className="text-xs text-muted-foreground">{mockPriorStudies.length}</span>
              </div>
              <div className="divide-y divide-border">
                {mockPriorStudies.map((prior) => (
                  <div key={prior.id} className="p-3">
                    <button
                      onClick={() => setExpandedPrior(expandedPrior === prior.id ? null : prior.id)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div>
                        <p className="text-sm font-medium">{prior.type}</p>
                        <p className="text-xs text-muted-foreground">{prior.date}</p>
                      </div>
                      {expandedPrior === prior.id ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    {expandedPrior === prior.id && prior.reportText && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {prior.reportText}
                        </p>
                        <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                          <Download className="w-3 h-3 mr-1" />
                          Download DICOM
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Notes */}
          <Collapsible open={clinicalNotesOpen} onOpenChange={setClinicalNotesOpen}>
            <div className="clinical-card">
              <CollapsibleTrigger asChild>
                <button className="clinical-card-header w-full flex items-center justify-between cursor-pointer hover:bg-muted/50">
                  <h3 className="text-sm font-semibold">Clinical Notes</h3>
                  {clinicalNotesOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="clinical-card-body">
                  <p className="text-sm text-muted-foreground">
                    Patient presents with persistent cough for 3 weeks. History of smoking (20 pack-years). 
                    Rule out pulmonary pathology.
                  </p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Technical Notes */}
          <Collapsible open={techNotesOpen} onOpenChange={setTechNotesOpen}>
            <div className="clinical-card">
              <CollapsibleTrigger asChild>
                <button className="clinical-card-header w-full flex items-center justify-between cursor-pointer hover:bg-muted/50">
                  <h3 className="text-sm font-semibold">Technical Notes</h3>
                  {techNotesOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="clinical-card-body">
                  <p className="text-sm text-muted-foreground">
                    Study performed on Siemens SOMATOM Definition Edge. 
                    Slice thickness: 1.5mm. kVp: 120. Motion artifact present - limited evaluation of bases.
                  </p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
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
