import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
}

export function DeleteConfirmDialog({ open, onOpenChange, onConfirm, title }: DeleteConfirmDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle>{t("dialog_confirm_delete")}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {title 
              ? t("dialog_delete_message").replace("{title}", `"${title}"`)
              : t("dialog_delete_message").replace("{title}", "this item")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>
            {t("delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
