import { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Check,
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  Calendar,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  useDocumentStatus,
  useUploadDocument,
  useDeleteDocument,
  useExpiryAlerts,
  DocumentStatus,
  DOCUMENT_TYPES,
  getStatusColor,
  formatExpiryDate,
} from '@/hooks/useDriverDocuments';
import { cn } from '@/lib/utils';

export function DocumentManager() {
  const { documents, summary, isComplete, hasUrgentItems, isLoading } = useDocumentStatus();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  const [selectedDoc, setSelectedDoc] = useState<DocumentStatus | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    required: true,
    optional: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enable automatic expiry alerts
  useExpiryAlerts();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDoc) return;

    uploadDocument.mutate({
      documentType: selectedDoc.type.id,
      file,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });

    setUploadDialogOpen(false);
    setExpiryDate('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openUploadDialog = (doc: DocumentStatus) => {
    setSelectedDoc(doc);
    setUploadDialogOpen(true);
  };

  const getStatusIcon = (status: DocumentStatus['status']) => {
    switch (status) {
      case 'approved':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expiring':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'missing':
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: DocumentStatus['status']) => {
    switch (status) {
      case 'approved':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'expiring':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      case 'rejected':
        return 'Rejected';
      case 'missing':
      default:
        return 'Not Uploaded';
    }
  };

  const requiredDocs = documents.filter((d) => d.type.required);
  const optionalDocs = documents.filter((d) => !d.type.required);
  const completionPercent = Math.round((summary.approved / summary.total) * 100);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Document Verification
            </CardTitle>
            <CardDescription className="mt-1">
              Keep your documents up to date to continue driving
            </CardDescription>
          </div>
          {isComplete ? (
            <Badge className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Fully Verified
            </Badge>
          ) : hasUrgentItems ? (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Action Required
            </Badge>
          ) : (
            <Badge variant="secondary">
              {summary.approved}/{summary.total} Complete
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Verification Progress</span>
            <span className="font-medium">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2 mt-4">
          {summary.pending > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              <Clock className="h-3 w-3 mr-1" />
              {summary.pending} Pending
            </Badge>
          )}
          {summary.expiring > 0 && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {summary.expiring} Expiring
            </Badge>
          )}
          {summary.expired > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              {summary.expired} Expired
            </Badge>
          )}
          {summary.rejected > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-300">
              <X className="h-3 w-3 mr-1" />
              {summary.rejected} Rejected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Required Documents */}
        <Collapsible
          open={expandedSections.required}
          onOpenChange={(open) =>
            setExpandedSections({ ...expandedSections, required: open })
          }
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="font-semibold">Required Documents ({requiredDocs.length})</span>
              {expandedSections.required ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {requiredDocs.map((doc) => (
              <DocumentRow
                key={doc.type.id}
                doc={doc}
                onUpload={() => openUploadDialog(doc)}
                onView={() => {
                  setSelectedDoc(doc);
                  setViewDialogOpen(true);
                }}
                onDelete={() => doc.document && deleteDocument.mutate(doc.document.id)}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Optional Documents */}
        {optionalDocs.length > 0 && (
          <Collapsible
            open={expandedSections.optional}
            onOpenChange={(open) =>
              setExpandedSections({ ...expandedSections, optional: open })
            }
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="font-semibold">Optional Documents ({optionalDocs.length})</span>
                {expandedSections.optional ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {optionalDocs.map((doc) => (
                <DocumentRow
                  key={doc.type.id}
                  doc={doc}
                  onUpload={() => openUploadDialog(doc)}
                  onView={() => {
                    setSelectedDoc(doc);
                    setViewDialogOpen(true);
                  }}
                  onDelete={() => doc.document && deleteDocument.mutate(doc.document.id)}
                  getStatusIcon={getStatusIcon}
                  getStatusText={getStatusText}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload {selectedDoc?.type.name}</DialogTitle>
            <DialogDescription>{selectedDoc?.type.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedDoc?.type.validityMonths && (
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Typically valid for {selectedDoc.type.validityMonths} months
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Document File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                disabled={uploadDocument.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: JPG, PNG, PDF (max 10MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.type.name}</DialogTitle>
          </DialogHeader>

          {selectedDoc?.document && (
            <div className="space-y-4">
              <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                {selectedDoc.document.document_url.endsWith('.pdf') ? (
                  <iframe
                    src={selectedDoc.document.document_url}
                    className="w-full h-full"
                    title={selectedDoc.type.name}
                  />
                ) : (
                  <img
                    src={selectedDoc.document.document_url}
                    alt={selectedDoc.type.name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium flex items-center gap-1">
                    {getStatusIcon(selectedDoc.status)}
                    {getStatusText(selectedDoc.status)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">
                    {formatExpiryDate(selectedDoc.document.expiry_date)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uploaded</p>
                  <p className="font-medium">
                    {new Date(selectedDoc.document.created_at).toLocaleDateString('en-ZA')}
                  </p>
                </div>
                {selectedDoc.document.verified_at && (
                  <div>
                    <p className="text-muted-foreground">Verified</p>
                    <p className="font-medium">
                      {new Date(selectedDoc.document.verified_at).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                )}
              </div>

              {selectedDoc.document.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                  <p className="text-sm text-red-700">
                    {selectedDoc.document.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => openUploadDialog(selectedDoc!)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface DocumentRowProps {
  doc: DocumentStatus;
  onUpload: () => void;
  onView: () => void;
  onDelete: () => void;
  getStatusIcon: (status: DocumentStatus['status']) => JSX.Element;
  getStatusText: (status: DocumentStatus['status']) => string;
}

function DocumentRow({
  doc,
  onUpload,
  onView,
  onDelete,
  getStatusIcon,
  getStatusText,
}: DocumentRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-colors',
        doc.status === 'expired' && 'border-red-300 bg-red-50',
        doc.status === 'expiring' && 'border-orange-300 bg-orange-50',
        doc.status === 'rejected' && 'border-red-300 bg-red-50',
        doc.status === 'missing' && 'border-dashed',
        doc.status === 'approved' && 'border-green-300 bg-green-50'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center',
            getStatusColor(doc.status).replace('bg-', 'bg-opacity-20 bg-')
          )}
        >
          <FileText className={cn('h-5 w-5', getStatusColor(doc.status).replace('bg-', 'text-').replace('-500', '-600'))} />
        </div>
        <div>
          <p className="font-medium">{doc.type.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon(doc.status)}
            <span>{getStatusText(doc.status)}</span>
            {doc.daysUntilExpiry !== null && doc.daysUntilExpiry <= 30 && doc.daysUntilExpiry > 0 && (
              <span className="text-orange-600">({doc.daysUntilExpiry} days left)</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {doc.document && (
          <>
            <Button variant="ghost" size="icon" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button
          variant={doc.status === 'missing' ? 'default' : 'outline'}
          size="sm"
          onClick={onUpload}
        >
          <Upload className="h-4 w-4 mr-2" />
          {doc.document ? 'Update' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}

export default DocumentManager;
