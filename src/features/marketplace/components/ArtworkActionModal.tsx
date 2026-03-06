import { Button, Input, Modal } from '@ui/index';
import { Field } from '@components/shared/Field';
import type { Artwork } from '../types/artwork.types';

interface ArtworkActionModalProps {
  artwork: Artwork;
  mode: 'bid' | 'inquire';
  bidValue: number;
  onBidValueChange: (value: number) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const ArtworkActionModal = ({
  artwork,
  mode,
  bidValue,
  onBidValueChange,
  onClose,
  onSubmit,
}: ArtworkActionModalProps) => (
  <Modal title={mode === 'bid' ? 'Collector Bid' : 'Artwork Inquiry'} onClose={onClose} size="sm">
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
        <p className="muted-text">
          Send a collector interest signal and follow up directly with the gallery or artist.
        </p>
      )}
      <Button variant="primary" fullWidth onClick={onSubmit}>
        {mode === 'bid' ? 'Submit Bid' : 'Send Inquiry'}
      </Button>
    </div>
  </Modal>
);
