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
  console.log('ConflictDialog render:', { isOpen, conflicts: conflicts.length })
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Schedule Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            Your new study plan has {conflicts.length} schedule conflict{conflicts.length > 1 ? 's' : ''} with existing plans. 
            Don't worry - we can fix this! Choose how you'd like to proceed:
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
            <h4 className="font-medium text-blue-800 mb-3">What would you like to do?</h4>
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-fit">🔄 Regenerate (Recommended):</span>
                <span>Automatically create a new conflict-free plan using available time slots. This keeps all your existing plans intact and finds the best available times for your new subjects.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-fit">⚠️ Overwrite:</span>
                <span>Remove the conflicting study plans and save this new plan. <strong>Warning:</strong> This will permanently delete the existing plans that have conflicts.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-fit">❌ Cancel:</span>
                <span>Go back to modify your study plan requirements (change subjects, daily hours, or target date)</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          <Button 
            onClick={onCancel} 
            variant="outline"
            className="order-3 sm:order-1 border-gray-300 hover:bg-gray-50"
          >
            ❌ Cancel
          </Button>
          <Button 
            onClick={onRegenerate}
            className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            🔄 Regenerate (Recommended)
          </Button>
          <Button 
            onClick={onOverwrite}
            variant="destructive"
            className="order-2 sm:order-3 bg-orange-600 hover:bg-orange-700 font-medium"
          >
            ⚠️ Overwrite Existing Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}