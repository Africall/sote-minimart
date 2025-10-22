import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface KeyboardShortcutsDialogProps {
  showShortcuts: boolean;
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  showShortcuts,
  setShowShortcuts
}) => {
  return (
    <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick access keys for common operations
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">F1</TableCell>
                <TableCell>Focus Search</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">F2</TableCell>
                <TableCell>Void Transaction</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">F3</TableCell>
                <TableCell>Apply Discount</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">F4</TableCell>
                <TableCell>Price Check</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">F5</TableCell>
                <TableCell>Focus Barcode Scanner</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">F12</TableCell>
                <TableCell>Show/Hide Shortcuts</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
