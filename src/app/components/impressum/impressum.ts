import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-impressum',
  imports: [RouterLink],
  templateUrl: './impressum.html',
  styleUrl: './impressum.css',
})
export class Impressum {
  readonly currentYear = new Date().getFullYear();
}
