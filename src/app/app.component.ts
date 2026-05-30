import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
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
    MatMenuModule,
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
    private route: ActivatedRoute,
    private tournaments: TournamentService,
    private cdr: ChangeDetectorRef
  ) {
    this.current = this.tournaments.current;
  }

  ngOnInit() {
    this.tournaments.load().subscribe(() => {
      this.editions = this.tournaments['_editions'].value;
      this.current = this.tournaments.current;
      this.cdr.markForCheck();
    });

    // URL query params win over localStorage, so a shared link like
    // /standings?year=2026&division=1 always lands the viewer on D1
    // regardless of what they had picked before.
    this.route.queryParamMap.subscribe((params) => {
      const yearStr = params.get('year');
      const division = params.get('division');
      if (yearStr && division) {
        const year = Number(yearStr);
        if (!Number.isNaN(year)) {
          this.tournaments.setCurrent({ year, division });
        }
      }
    });

    this.tournaments.current$.subscribe((c) => {
      this.current = c;
      this.cdr.markForCheck();
    });
  }

  /** Same identity for *ngFor trackBy + active-state comparison. */
  sameEdition(a: { year: number; division: string }, b: { year: number; division: string }): boolean {
    return a.year === b.year && a.division === b.division;
  }

  selectEdition(e: TournamentEdition) {
    this.tournaments.setCurrent({ year: e.year, division: e.division });
    // Reflect the choice in the URL so the user can copy + share it
    // and end up on the same edition.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { year: e.year, division: e.division },
      queryParamsHandling: 'merge',
    });
  }

  navigate(route: string) {
    // Preserve query params so the current edition follows the user
    // across menu clicks (e.g. /standings?division=1 -> /teams?division=1).
    this.router.navigate([route], { queryParamsHandling: 'preserve' });
  }
}
