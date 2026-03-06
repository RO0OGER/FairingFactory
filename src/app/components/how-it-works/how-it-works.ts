import { Component } from '@angular/core';

interface Step {
  number: number;
  title: string;
  text: string;
}

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.css',
})
export class HowItWorks {
  readonly steps: Step[] = [
    {
      number: 1,
      title: 'Import',
      text: 'Wir beziehen Fairing-Kits von sorgfältig ausgewählten Herstellern – ausschliesslich Modelle, die unsere Qualitätsanforderungen erfüllen.',
    },
    {
      number: 2,
      title: 'Qualitätsprüfung',
      text: 'Jedes Teil wird in der Schweiz individuell geprüft: Passform, Lackierung, Vollständigkeit. Defekte Teile werden nicht weitergegeben.',
    },
    {
      number: 3,
      title: 'Lieferung',
      text: 'Bestellungen werden direkt aus unserem Schweizer Lager versendet – kurze Lieferzeiten, transparente Preise inklusive Zoll und Versand.',
    },
  ];
}
