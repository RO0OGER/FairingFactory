import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommunityPhoto } from '../../services/community.service';

@Component({
  selector: 'app-photo-lightbox',
  templateUrl: './photo-lightbox.html',
  styleUrl: './photo-lightbox.css',
})
export class PhotoLightbox {
  @Input({ required: true }) photo!: CommunityPhoto;
  @Output() closeEvent = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeEvent.emit();
  }
}
