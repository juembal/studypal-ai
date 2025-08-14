'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScheduleConflict } from '@/lib/scheduleManager'
import { AlertTriangle, Clock, Calendar } from 'lucide-react'

interface ConflictDialogProps {
  isOpen: boolean
  conflicts: ScheduleConflict[]
  onRegenerate: () => void
  onOverwrite: () => void
  onCancel: () => void
}

export default function ConflictDialog({ 
  isOpen, 
  conflicts, 
  onRegenerate, 
  onOverwrite, 
  onCancel 
}: ConflictDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Schedule Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            Your new study plan conflicts with existing schedules. Choose how to proceed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {conflicts.map((conflict, index) => (
              <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">{conflict.day}</span>
                  <Badge variant="outline" className="text-orange-700">
                    {conflict.timeSlot}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-700">Existing:</span>
                    <span className="font-medium">{conflict.existingSubject}</span>
                    <span className="text-gray-500">from "{conflict.existingPlan}"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-700">New:</span>
                    <span className="font-medium">{conflict.newSubject}</span>
                    <span className="text-gray-500">from new plan</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">What would you like to do?</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <span className="font-medium">Regenerate:</span>
                <span>Create a new plan that avoids these time conflicts</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium">Overwrite:</span>
                <span>Replace existing plans and use the new schedule</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button onClick={onCancel} className="bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            Cancel
          </Button>
          <Button 
            onClick={onRegenerate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Regenerate (Avoid Conflicts)
          </Button>
          <Button 
            onClick={onOverwrite}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Overwrite Existing Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}