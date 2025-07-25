import { useState, useRef } from "react";
import { Download, Upload, Save, AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { dataExportManager } from "@/lib/data-export";

export default function DataExportDialog() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await dataExportManager.exportData();
      
      // Save to local storage as backup
      await dataExportManager.saveToLocalStorage(data);
      
      // Download as file
      dataExportManager.downloadDataAsFile(data);
      
      toast({
        title: "Export Successful",
        description: "Your cricket data has been exported and saved locally",
      });
      
      setIsExportOpen(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToLocal = async () => {
    setIsExporting(true);
    try {
      const data = await dataExportManager.exportData();
      const success = await dataExportManager.saveToLocalStorage(data);
      
      if (success) {
        toast({
          title: "Data Saved",
          description: "Your cricket data has been saved to local storage",
        });
      } else {
        throw new Error("Failed to save to local storage");
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save data locally. Storage may be full.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportErrors([]);

    try {
      // Parse the file
      setImportProgress(25);
      const data = await dataExportManager.parseImportFile(file);
      
      // Import the data
      setImportProgress(50);
      const result = await dataExportManager.importData(data);
      
      setImportProgress(100);
      
      if (result.success) {
        // Refresh all queries to show imported data
        queryClient.invalidateQueries();
        
        toast({
          title: "Import Successful",
          description: "Your cricket data has been imported successfully",
        });
        setIsImportOpen(false);
      } else {
        setImportErrors(result.errors);
        toast({
          title: "Import Completed with Errors",
          description: `${result.errors.length} items failed to import`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setImportErrors([`Import failed: ${error.message}`]);
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRestoreFromLocal = async () => {
    setIsImporting(true);
    setImportProgress(0);
    setImportErrors([]);

    try {
      const data = dataExportManager.loadFromLocalStorage();
      if (!data) {
        throw new Error("No backup data found in local storage");
      }

      setImportProgress(50);
      const result = await dataExportManager.importData(data);
      setImportProgress(100);

      if (result.success) {
        queryClient.invalidateQueries();
        toast({
          title: "Restore Successful",
          description: "Your cricket data has been restored from local backup",
        });
        setIsImportOpen(false);
      } else {
        setImportErrors(result.errors);
        toast({
          title: "Restore Completed with Errors",
          description: `${result.errors.length} items failed to restore`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setImportErrors([`Restore failed: ${error.message}`]);
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="touch-feedback">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Cricket Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will export all your cricket data including teams, players, and match history.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                className="cricket-green-600 hover:bg-cricket-green-700 touch-feedback"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Download as File"}
              </Button>
              
              <Button
                onClick={handleSaveToLocal}
                disabled={isExporting}
                variant="outline"
                className="touch-feedback"
              >
                <Save className="w-4 h-4 mr-2" />
                {isExporting ? "Saving..." : "Save to Local Storage"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="touch-feedback">
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Cricket Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing data...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {importErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Import Errors:</div>
                    {importErrors.slice(0, 3).map((error, index) => (
                      <div key={index} className="text-sm">{error}</div>
                    ))}
                    {importErrors.length > 3 && (
                      <div className="text-sm">...and {importErrors.length - 3} more errors</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                  disabled={isImporting}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full cricket-green-600 hover:bg-cricket-green-700 touch-feedback"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? "Importing..." : "Import from File"}
                </Button>
              </div>
              
              <Button
                onClick={handleRestoreFromLocal}
                disabled={isImporting}
                variant="outline"
                className="touch-feedback"
              >
                <Save className="w-4 h-4 mr-2" />
                {isImporting ? "Restoring..." : "Restore from Local Storage"}
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Importing data will add to your existing data. 
                Make sure to export a backup first if you want to preserve your current data.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}