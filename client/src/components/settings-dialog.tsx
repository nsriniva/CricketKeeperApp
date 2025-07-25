import { useState } from "react";
import { Settings, Download, Upload, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import DataExportDialog from "./data-export-dialog";
import { useToast } from "@/hooks/use-toast";

export default function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleClearAllData = () => {
    if (confirm("Are you sure you want to clear all cricket data? This action cannot be undone.")) {
      localStorage.clear();
      toast({
        title: "Data Cleared",
        description: "All local data has been cleared. Please refresh the page.",
      });
    }
  };

  const getStorageUsage = () => {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return `${(total / 1024).toFixed(1)} KB`;
    } catch {
      return "Unknown";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-8 h-8 flex items-center justify-center touch-feedback text-white hover:bg-white/20 rounded">
          <Settings className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Data Management Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Data Management</h3>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Storage Usage</div>
                <div className="text-xs text-gray-500">{getStorageUsage()} used</div>
              </div>
              <Info className="w-4 h-4 text-gray-400" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <DataExportDialog />
            </div>

            <Separator />

            <Button
              onClick={handleClearAllData}
              variant="destructive"
              size="sm"
              className="w-full touch-feedback"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>

          {/* App Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">About</h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Version</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Platform</span>
                <span>Web App</span>
              </div>
              <div className="flex justify-between">
                <span>Storage</span>
                <span>Local Device</span>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                CricketPro stores all your data locally on your device. 
                Export your data regularly to avoid losing it.
              </AlertDescription>
            </Alert>
          </div>

          {/* PWA Install Hint */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Install App</h3>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>iOS:</strong> Tap the share button in Safari and select "Add to Home Screen" 
                to install CricketPro as an app on your device.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}