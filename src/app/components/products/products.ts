import { Component } from '@angular/core';

interface Product {
  model: string;
  years: string;
  price: number;
  description: string;
  available: boolean;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  readonly products: Product[] = [
    {
      model: 'Kawasaki ZX-6R',
      years: '2003–2016',
      price: 489,
      description: 'Komplettes Fairing-Kit inkl. aller Verkleidungsteile. Lackierung nach Wahl.',
      available: true,
    },
    {
      model: 'Yamaha YZF-R6',
      years: '2006–2021',
      price: 519,
      description: 'Komplettes Fairing-Kit inkl. aller Verkleidungsteile. Lackierung nach Wahl.',
      available: true,
    },
    {
      model: 'Honda CBR600RR',
      years: '2007–2012',
      price: 499,
      description: 'Komplettes Fairing-Kit inkl. aller Verkleidungsteile. Lackierung nach Wahl.',
      available: true,
    },
    {
      model: 'Suzuki GSX-R600',
      years: '2008–2017',
      price: 479,
      description: 'Komplettes Fairing-Kit inkl. aller Verkleidungsteile. Lackierung nach Wahl.',
      available: false,
    },
  ];
}
