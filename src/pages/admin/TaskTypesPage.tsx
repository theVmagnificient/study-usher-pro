import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { mockTaskTypes } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function TaskTypesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Task Types"
        subtitle="Configure pricing and TAT by client and modality"
        actions={
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task Type
          </Button>
        }
      />

      <div className="clinical-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Modality</th>
              <th>Body Area</th>
              <th>Priors</th>
              <th>Expected TAT</th>
              <th>Price</th>
              <th>Payout</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mockTaskTypes.map((tt) => (
              <tr key={tt.id}>
                <td className="text-sm font-medium">{tt.client}</td>
                <td className="text-sm">{tt.modality}</td>
                <td className="text-sm">{tt.bodyArea}</td>
                <td>
                  <span className={`status-badge ${tt.hasPriors ? 'status-assigned' : 'status-new'}`}>
                    {tt.hasPriors ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="text-sm">{tt.expectedTAT}h</td>
                <td className="text-sm font-medium">${tt.price}</td>
                <td className="text-sm">${tt.physicianPayout}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tt.id)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Task Type' : 'New Task Type'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Client</Label>
              <Input id="client" placeholder="e.g., City General Hospital" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Modality</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CT">CT</SelectItem>
                    <SelectItem value="MRI">MRI</SelectItem>
                    <SelectItem value="X-Ray">X-Ray</SelectItem>
                    <SelectItem value="US">US</SelectItem>
                    <SelectItem value="PET">PET</SelectItem>
                    <SelectItem value="NM">NM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Body Area</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Head">Head</SelectItem>
                    <SelectItem value="Neck">Neck</SelectItem>
                    <SelectItem value="Chest">Chest</SelectItem>
                    <SelectItem value="Abdomen">Abdomen</SelectItem>
                    <SelectItem value="Pelvis">Pelvis</SelectItem>
                    <SelectItem value="Spine">Spine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="priors" />
              <Label htmlFor="priors" className="text-sm font-normal">Includes prior studies</Label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tat">TAT (hours)</Label>
                <Input id="tat" type="number" placeholder="4" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input id="price" type="number" placeholder="150" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payout">Payout ($)</Label>
                <Input id="payout" type="number" placeholder="75" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsDialogOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
