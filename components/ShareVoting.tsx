'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Share2, Copy, QrCode } from 'lucide-react'
import { toast } from 'sonner'

interface ShareVotingProps {
  votingId: string
  title: string
}

export function ShareVoting({ votingId, title }: ShareVotingProps) {
  const [isQrVisible, setIsQrVisible] = useState(false)
  const votingUrl = `${window.location.origin}/vote/${votingId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(votingUrl)
      toast.success('Link berhasil disalin')
    } catch (error) {
      toast.error('Gagal menyalin link')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bagikan Voting</DialogTitle>
          <DialogDescription>
            Bagikan link voting ini kepada orang lain
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              value={votingUrl}
              readOnly
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsQrVisible(!isQrVisible)}
            >
              <QrCode className="mr-2 h-4 w-4" />
              {isQrVisible ? 'Sembunyikan QR Code' : 'Tampilkan QR Code'}
            </Button>
            
            {isQrVisible && (
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                <QRCodeSVG
                  value={votingUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
                <p className="text-sm text-muted-foreground">
                  Pindai QR code untuk membuka voting
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 