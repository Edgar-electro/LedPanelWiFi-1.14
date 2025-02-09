import {Component, OnDestroy, OnInit} from '@angular/core';
import {debounceTime, Subject, takeUntil} from 'rxjs';
import {CommonService} from '../../../services/common/common.service';
import {LanguagesService} from '../../../services/languages/languages.service';
import {ManagementService} from '../../../services/management/management.service';
import {WebsocketService} from '../../../services/websocket/websocket.service';
import {distinctUntilChanged} from "rxjs/operators";
import {isNullOrUndefinedOrEmpty} from "../../../services/helper";
import { TabNetworkApComponent } from '../tab-network-ap/tab-network-ap.component';
import { TabNetworkSsidComponent } from '../tab-network-ssid/tab-network-ssid.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
    selector: 'app-tab-network',
    templateUrl: './tab-network.component.html',
    styleUrls: ['./tab-network.component.scss'],
    standalone: true,
    imports: [
        MatTabsModule,
        MatIconModule,
        MatTooltipModule,
        TabNetworkSsidComponent,
        TabNetworkApComponent,
    ],
})
export class TabNetworkComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();

  constructor(
    public socketService: WebsocketService,
    public managementService: ManagementService,
    public commonService: CommonService,
    public L: LanguagesService
  ) {
  }

  ngOnInit() {
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
