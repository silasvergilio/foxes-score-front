import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormField, MatSelectModule } from '@angular/material/select';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ApiService } from '../../services/api.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-add-game',
  imports: [
    MatCardModule,
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],

  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
  ],
  templateUrl: './add-game.component.html',
  styleUrl: './add-game.component.scss',
})
export class AddGameComponent {
  constructor(private api: ApiService, private utils: UtilsService) {}

  addGameFormGroup = new FormGroup({
    tournament: new FormControl('', Validators.required),
    location: new FormControl('', Validators.required),
    date: new FormControl('', Validators.required),
    startedTime: new FormControl('', Validators.required),
    startOffense: new FormControl('', Validators.required),
    startDefense: new FormControl('', Validators.required),
  });

  public submit() {
    const formValue = { ...this.addGameFormGroup.value };

    if (this.addGameFormGroup.valid) {
      const rawDate = formValue.date as unknown as Date;
      formValue.date = this.utils.formatDate(rawDate); // string DD/MM/AAAA


      this.api.post('game', formValue).subscribe({
        next: (data) => {
          this.addGameFormGroup.reset();
        },
        error: (error) => {
          console.error('Error:', error);
        },
      });
    } else {
      console.log('Formulário inválido');
    }
  }
}
