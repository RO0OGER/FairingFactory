import { Component } from '@angular/core';
import { Hero } from './components/hero/hero';
import { HowItWorks } from './components/how-it-works/how-it-works';
import { Products } from './components/products/products';
import { ContactForm } from './components/contact-form/contact-form';
import { FeedbackForm } from './components/feedback-form/feedback-form';

@Component({
  selector: 'app-root',
  imports: [Hero, HowItWorks, Products, ContactForm, FeedbackForm],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly currentYear = new Date().getFullYear();
}
