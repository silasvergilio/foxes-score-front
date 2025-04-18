import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { BalLGame } from './interfaces/game.interface';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';


@Component({
  selector: 'app-root',
  imports: [MatCardModule, CommonModule, RouterModule,MatSidenavModule, MatIconModule, MatToolbarModule,MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  showFiller = false;
  title(title: any) {
    throw new Error('Method not implemented.');
  }
}