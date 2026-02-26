import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { LOCALE_ID } from '@angular/core';
import localeHr from '@angular/common/locales/hr';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { environment } from '../environments/environment';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

registerLocaleData(localeHr);

const app = initializeApp(environment.firebaseConfig);
const db = getFirestore(app);

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [
    { provide: LOCALE_ID, useValue: 'hr' },
    { provide: MAT_DATE_LOCALE, useValue: 'hr-HR' },
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
  ],
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed',
        style({ height: '0px', minHeight: '0', visibility: 'hidden' })
      ),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
  template: `
    <h1>Rezultati učenika</h1>

    <!--  Filter Controls -->
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
      <mat-form-field appearance="fill">
        <mat-label>Početni datum</mat-label>
        <input matInput [matDatepicker]="pickerStart" [(ngModel)]="startDate" (dateChange)="syncEndDate()" />
        <mat-datepicker-toggle matSuffix [for]="pickerStart"></mat-datepicker-toggle>
        <mat-datepicker #pickerStart></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="fill">
        <mat-label>Start Time (24h)</mat-label>
        <input matInput placeholder="HH:mm" [(ngModel)]="startTime" pattern="^([01]\\d|2[0-3]):([0-5]\\d)$"
          (click)="highlightTime($event)" (focus)="highlightTime($event)" />
      </mat-form-field>

      <mat-form-field appearance="fill">
        <mat-label>Završni datum</mat-label>
        <input matInput [matDatepicker]="pickerEnd" [(ngModel)]="endDate" />
        <mat-datepicker-toggle matSuffix [for]="pickerEnd"></mat-datepicker-toggle>
        <mat-datepicker #pickerEnd></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="fill">
        <mat-label>End Time (24h)</mat-label>
        <input matInput placeholder="HH:mm" [(ngModel)]="endTime" pattern="^([01]\\d|2[0-3]):([0-5]\\d)$"
          (click)="highlightTime($event)" (focus)="highlightTime($event)" />
      </mat-form-field>

      <button mat-raised-button color="primary" (click)="exportFiltered()">Export Filtered</button>
      <button mat-raised-button color="accent" (click)="exportToExcel()">Export All</button>
    </div>

    <!--  Table -->
    <table mat-table [dataSource]="dataSource" matSort multiTemplateDataRows class="mat-elevation-z8">

      <ng-container matColumnDef="tabletId">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Tablet ID</th>
        <td mat-cell *matCellDef="let row">{{row.tabletId}}</td>
      </ng-container>

      <ng-container matColumnDef="docID">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Doc ID</th>
        <td mat-cell *matCellDef="let row">{{row.docID}}</td>
      </ng-container>

      <ng-container matColumnDef="sessionID">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Session ID</th>
        <td mat-cell *matCellDef="let row">{{row.sessionID}}</td>
      </ng-container>

      <ng-container matColumnDef="username">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Username</th>
        <td mat-cell *matCellDef="let row">{{row.username}}</td>
      </ng-container>

      <ng-container matColumnDef="Konfiguracija">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Konfiguracija</th>
        <td mat-cell *matCellDef="let row">{{row.Konfiguracija}}</td>
      </ng-container>

      <ng-container matColumnDef="brojNetocnih">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Netocni</th>
        <td mat-cell *matCellDef="let row">{{row.brojNetocnih}}</td>
      </ng-container>

      <ng-container matColumnDef="brojTocnih">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Tocni</th>
        <td mat-cell *matCellDef="let row">{{row.brojTocnih}}</td>
      </ng-container>

      <ng-container matColumnDef="UkupanBroj">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Ukupan</th>
        <td mat-cell *matCellDef="let row">{{row.UkupanBroj}}</td>
      </ng-container>

      <ng-container matColumnDef="Vrijeme">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Vrijeme</th>
        <td mat-cell *matCellDef="let row">{{row.Vrijeme}}</td>
      </ng-container>

      <ng-container matColumnDef="PocetakAktivnosti">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Početak Aktivnosti</th>
        <td mat-cell *matCellDef="let row">{{row.PocetakAktivnosti}}</td>
      </ng-container>

      <ng-container matColumnDef="KrajAktivnosti">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Kraj Aktivnosti</th>
        <td mat-cell *matCellDef="let row">{{row.KrajAktivnosti}}</td>
      </ng-container>

      <!-- Expanded Detail -->
      <ng-container matColumnDef="expand">
        <td mat-cell *matCellDef="let element" colspan="100%">
          <div class="expandable-content" >
            <div *ngIf="element == expandedElement">
              <div *ngIf="!element.answers">Loading...</div>
              <ul *ngIf="element.answers?.length">
                <li *ngFor="let ans of element.answers">
                  {{ans.Zadatak}}  {{ans.Odgovor}}
                  <span *ngIf="ans.Tocno">✔</span>
                  <span *ngIf="!ans.Tocno">❌</span>
                </li>
              </ul>
              <div *ngIf="element.answers?.length === 0">No answers found.</div>
            </div>
          </div>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="parent-row" (click)="toggleRow(row)"></tr>
      <tr mat-row *matRowDef="let row; columns: ['expand']" class="detail-row"></tr>
    </table>

    <mat-paginator [pageSizeOptions]="[10,25,50]" showFirstLastButtons></mat-paginator>
  `,
  styles: [`
    .parent-row { cursor:pointer; }
    .detail-row td { padding:0; border:0; }
    .expandable-content { overflow:hidden; padding:16px; background:#fafafa; }
  `]
})
export class AppComponent implements OnInit {
  constructor(private dateAdapter: DateAdapter<Date>) {}
  displayedColumns: string[] = [
    'tabletId','docID','sessionID','username','Konfiguracija',
    'brojNetocnih','brojTocnih','UkupanBroj',
    'Vrijeme','PocetakAktivnosti','KrajAktivnosti'
  ];
  dataSource = new MatTableDataSource<any>([]);
  expandedElement: any | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  startDate: Date | null = null;
  endDate: Date | null = null;
  startTime: string = '00:00';
  endTime: string = '23:59';

  async ngOnInit() {
    this.dateAdapter.setLocale('hr-HR');
    try {
      const sessionsSnap = await getDocs(collection(db, 'activitySessions'));
      const allSessions: any[] = [];

      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatTimestamp = (ts: any) => {
        if (!ts?.toDate) return null;
        const d = ts.toDate();
        return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

      for (const sessionDoc of sessionsSnap.docs) {
        const sessionData = sessionDoc.data();
        const sessionId = sessionDoc.id;

        const playersSnap = await getDocs(collection(db, `activitySessions/${sessionId}/players`));
        playersSnap.forEach(playerDoc => {
          const p = playerDoc.data();
          allSessions.push({
            tabletId: p['tabletId'] || '',
            docID: playerDoc.id,
            sessionID: sessionId,
            username: p['imeUcenika'] || p['username'] || '',
            Konfiguracija: p['konfiguracija'] || sessionData['Konfiguracija'] || '',
            brojNetocnih: p['netocni'] || 0,
            brojTocnih: p['tocni'] || 0,
            UkupanBroj: p['ukupno'] || 0,
            Vrijeme: p['vrijeme'] || sessionData['vrijeme'] || 0,
            PocetakAktivnosti: formatTimestamp(sessionData['timestamp']),
            KrajAktivnosti: formatTimestamp(sessionData['endTimestamp']),
            rawStart: sessionData['timestamp']?.toDate?.(),
          });
        });
      }
      this.dataSource.data = allSessions;
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }

  async toggleRow(row: any, event?: MouseEvent) {
  event?.stopPropagation(); // prevent clicks from bubbling up from inner content

  if (this.expandedElement && this.expandedElement === row) {
    this.expandedElement = null; // collapse
    return;
  }

  this.expandedElement = row; // expand new one

  // Fetch answers only once per row
  if (!row.answers) {
    const answersSnap = await getDocs(collection(db, `activitySessions/${row.sessionID}/answers`));
    row.answers = answersSnap.docs
      .map(d => {
        const a = d.data();
        return {
          Zadatak: a['Zadatak'],
          Odgovor: a['Odgovor'],
          Tocno: a['Točno'] === true,
          username: a['username'] || '',
          timestamp: a['timestamp']?.toDate()?.toLocaleString() || ''
        };
      })
      .filter(a => a.username === row.username);
  }
}

  highlightTime(event: any) {
    const input = event.target as HTMLInputElement;
    setTimeout(() => {
      const pos = input.selectionStart ?? 0;
      if (pos <= 2) input.setSelectionRange(0, 2);
      else if (pos >= 3) input.setSelectionRange(3, 5);
    });
  }

  syncEndDate() {
    if (this.startDate) this.endDate = new Date(this.startDate);
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  }

  exportFiltered() {
    if (!this.startDate || !this.endDate) {
      alert('Select start and end date');
      return;
    }
    const start = this.combineDateAndTime(this.startDate, this.startTime).getTime();
    const end = this.combineDateAndTime(this.endDate, this.endTime).getTime();

    const filtered = this.dataSource.data.filter(r => {
      if (!r.rawStart) return false;
      const ts = new Date(r.rawStart).getTime();
      return ts >= start && ts <= end;
    });
    this.exportToExcel(filtered);
  }

  exportToExcel(data: any[] = this.dataSource.data) {
    const excelData = data.map(r => ({
      TabletID: r.tabletId,
      DocID: r.docID,
      SessionID: r.sessionID,
      Username: r.username,
      Konfiguracija: r.Konfiguracija,
      Netocni: r.brojNetocnih,
      Tocni: r.brojTocnih,
      Ukupan: r.UkupanBroj,
      Vrijeme: r.Vrijeme,
      PocetakAktivnosti: r.PocetakAktivnosti,
      KrajAktivnosti: r.KrajAktivnosti,
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = { Sheets: { Rezultati: ws }, SheetNames: ['Rezultati'] };
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'rezultati.xlsx');
  }
}
