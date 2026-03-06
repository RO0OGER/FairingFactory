import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MotorcycleService, UserMotorcycle } from '../../services/motorcycle.service';

@Component({
  selector: 'app-garage-modal',
  imports: [FormsModule],
  templateUrl: './garage-modal.html',
  styleUrl: './garage-modal.css',
})
export class GarageModal implements OnInit {
  protected moto = inject(MotorcycleService);

  readonly makes = signal<string[]>([]);
  readonly models = signal<string[]>([]);
  readonly makesLoading = signal(false);
  readonly modelsLoading = signal(false);
  readonly saving = signal(false);

  selectedMake = '';
  selectedModel = '';
  selectedYear: number | null = null;

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }

  async ngOnInit() {
    this.makesLoading.set(true);
    const list = await this.moto.getMakes();
    this.makes.set(list);
    this.makesLoading.set(false);
  }

  async onMakeChange() {
    this.selectedModel = '';
    this.models.set([]);
    if (!this.selectedMake) return;
    this.modelsLoading.set(true);
    const list = await this.moto.getModels(this.selectedMake);
    this.models.set(list);
    this.modelsLoading.set(false);
  }

  async addBike() {
    if (!this.selectedMake || !this.selectedModel) return;
    this.saving.set(true);
    await this.moto.addBike(this.selectedMake, this.selectedModel, this.selectedYear ?? undefined);
    this.selectedMake = '';
    this.selectedModel = '';
    this.selectedYear = null;
    this.models.set([]);
    this.saving.set(false);
  }

  bikeName(bike: UserMotorcycle): string {
    return this.moto.bikeName(bike);
  }

  close() {
    this.moto.showGarageModal.set(false);
  }
}
