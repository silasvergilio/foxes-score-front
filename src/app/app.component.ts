import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LoaderComponent } from './components/loader/loader.component';
import { TournamentService } from './services/tournament.service';
import {
  TournamentEdition,
  TournamentKey,
} from './interfaces/tournament.interface';

@Component({
  selector: 'app-root',
  imports: [
    MatCardModule,
    CommonModule,
    FormsModule,
    RouterModule,
    MatSidenavModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    LoaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  editions: TournamentEdition[] = [];
  current: TournamentKey;

  constructor(
    private socket: Socket,
    private router: Router,
    private tournaments: TournamentService,
    private cdr: ChangeDetectorRef
  ) {
    this.current = this.tournaments.current;
  }

  ngOnInit() {
    this.tournaments.load().subscribe(() => {
      this.editions = this.tournaments['_editions'].value;
      // current may have shifted if stored value wasn't in the list.
      this.current = this.tournaments.current;
      this.cdr.markForCheck();
    });
    this.tournaments.current$.subscribe((c) => {
      this.current = c;
      this.cdr.markForCheck();
    });
  }

  /** mat-select needs scalar values; encode as "year::division". */
  editionKey(e: { year: number; division: string }): string {
    return `${e.year}::${e.division}`;
  }

  onEditionChange(key: string) {
    const [yearStr, division] = key.split('::');
    this.tournaments.setCurrent({ year: Number(yearStr), division });
  }

  labelFor(e: TournamentEdition): string {
    return `Divisão ${e.division} · ${e.year}`;
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
