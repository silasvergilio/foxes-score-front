import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = '';

  constructor(private http: HttpClient) {
    if (window.location.hostname === 'localhost') {
      this.baseUrl = 'http://localhost:3000';
    } else {
      this.baseUrl = 'https://foxes-score-backend-601c21db8b30.herokuapp.com'; // <-- coloque aqui sua URL de produção
    }
  }

  // GET
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`);
  }

  // POST
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data);
  }

  // PUT
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, data);
  }
}
