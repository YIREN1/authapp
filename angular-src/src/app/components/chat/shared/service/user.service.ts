import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../services/auth.service';
export interface ServerResponse {
  success: boolean;
  msg: string;
  user: string;
}

@Injectable({
  providedIn: 'root'
})

export class UserService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) { }

  getUsers() {
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', this.authService.getToken());
    headers = headers.set('Content-Type', 'application/json');
    return this.http.get<ServerResponse[]>(`${environment.apiPrefix}/v1/users`, { headers });
  }
}
