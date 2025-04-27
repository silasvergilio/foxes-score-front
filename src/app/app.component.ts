import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [MatCardModule, CommonModule, RouterModule,MatSidenavModule, MatIconModule, MatToolbarModule,MatButtonModule,MatSidenavModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})

export class AppComponent {
  constructor(private socket: Socket, private router: Router) {}
  showFiller = false;
  title(title: any) {
    throw new Error('Method not implemented.');
  }

  public navigate(route: string) {
    console.log('route', route);
    this.router.navigate([route]);
  }
}