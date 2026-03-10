import { Button, Input, Modal, Textarea } from '@/components/ui';
import { Field } from '@/components/shared/Field';
import type { Artwork } from '../types/artwork.types';

interface ArtworkActionModalProps {
  artwork: Artwork;
  mode: 'bid' | 'auto-inquire';
  bidValue: number;
  collectorNote: string;
  onBidValueChange: (value: number) => void;
  onCollectorNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const ArtworkActionModal = ({
  artwork,
  mode,
  bidValue,
  collectorNote,
  onBidValueChange,
  onCollectorNoteChange,
  onClose,
  onSubmit,
}: ArtworkActionModalProps) => (
  <Modal title={mode === 'bid' ? 'Collector Bid' : 'Automatic Inquiry'} onClose={onClose} size="sm">
    <div className="content-grid">
      <div>
        <p className="eyebrow">{artwork.title}</p>
        <p className="muted-text">{artwork.artist}</p>
      </div>
      {mode === 'bid' ? (
        <Field label="Bid Amount">
          <Input
            type="number"
            value={bidValue}
            onChange={(event) => onBidValueChange(Number(event.target.value))}
          />
        </Field>
      ) : (
        <Field label="Collector Note" hint="This note will travel with the inquiry request.">
          <Textarea
            value={collectorNote}
            onChange={(event) => onCollectorNoteChange(event.target.value)}
            placeholder="Share what you respond to in the work, timing, budget, or any questions for the gallery."
          />
        </Field>
      )}
      <Button variant="default" className="w-full" onClick={onSubmit}>
        {mode === 'bid' ? 'Submit Bid' : 'Send Auto Inquiry'}
      </Button>
    </div>
  </Modal>
);
