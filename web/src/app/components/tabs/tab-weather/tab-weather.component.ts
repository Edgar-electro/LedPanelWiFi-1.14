import {Component, OnDestroy, OnInit} from '@angular/core';
import {debounceTime, Subject, takeUntil} from 'rxjs';
import {CommonService} from '../../../services/common/common.service';
import {LanguagesService} from '../../../services/languages/languages.service';
import {ManagementService} from '../../../services/management/management.service';
import {WebsocketService} from '../../../services/websocket/websocket.service';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {AppErrorStateMatcher, isNullOrUndefinedOrEmpty, rangeValidator} from "../../../services/helper";
import {distinctUntilChanged} from "rxjs/operators";
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { DisableControlDirective } from '../../../directives/disable-control.directive';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-tab-weather',
    templateUrl: './tab-weather.component.html',
    styleUrls: ['./tab-weather.component.scss'],
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatSelectModule,
        FormsModule,
        DisableControlDirective,
        MatOptionModule,
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule,
    ],
})
export class TabWeatherComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();

  weather_mode: number = -1;

  codeYandexFormControl = new FormControl(0, [Validators.required]);
  codeOWMFormControl = new FormControl(0, [Validators.required]);
  updateIntervalFormControl = new FormControl(0, [Validators.required, rangeValidator(15, 240)]);
  matcher = new AppErrorStateMatcher();

  constructor(
    public socketService: WebsocketService,
    public managementService: ManagementService,
    public commonService: CommonService,
    public L: LanguagesService
  ) {
  }

  ngOnInit() {

    this.socketService.isConnected$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged(), debounceTime(1000))
      .subscribe((isConnected: boolean) => {
        if (isConnected) {
          const request = 'WU|WR|WS|WT';
          this.managementService.getKeys(request);
        }
      });

    this.managementService.stateKey$
      .pipe(takeUntil(this.destroy$))
      .subscribe((key: string) => {
        if (!isNullOrUndefinedOrEmpty(key)) {
          switch (key) {
            case 'WU':
              this.weather_mode = this.managementService.state.weather_type;
              break;
            case 'WR':
              this.codeYandexFormControl.setValue(this.managementService.state.weather_yandex);
              break;
            case 'WS':
              this.codeOWMFormControl.setValue(this.managementService.state.weather_owm);
              break;
            case 'WT':
              this.updateIntervalFormControl.setValue(this.managementService.state.weather_update);
              break;
          }
        }
      });
  }

  isWeatherValid(): boolean {
    // @formatter:off
    return (this.codeYandexFormControl.valid || this.codeYandexFormControl.disabled) &&
           (this.codeOWMFormControl.valid || this.codeOWMFormControl.disabled) &&
            this.updateIntervalFormControl.valid;
    // @formatter:on
  }

  applyWeather($event: MouseEvent) {
    // @formatter:off
    const WU = this.managementService.state.weather_type   = this.weather_mode;
    const WR = this.managementService.state.weather_yandex = Number(this.codeYandexFormControl.value);
    const WS = this.managementService.state.weather_owm    = Number(this.codeOWMFormControl.value);
    const WT = this.managementService.state.weather_update = Number(this.updateIntervalFormControl.value);
    // @formatter:on

    // $12 4 X;      - использовать получение погоды с погодного сервера 0 - не получать погоду; 1 - Yandex; 2 - OpenWeatherMap
    // $12 5 I С C2; - интервал получения погоды с сервера в минутах (I) и код региона C - Yandex и код региона C2 - OpenWeatherMap
    this.socketService.sendText(`$12 4 ${WU};`);
    this.socketService.sendText(`$12 5 ${WT} ${WR} ${WS};`);
  }

  isDisabled(): boolean {
    return (
      !this.managementService.state.power || !this.socketService.isConnected
    );
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
