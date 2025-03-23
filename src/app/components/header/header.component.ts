import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDropdownOpen = false;
  isMobileMenuOpen = false;
  isMobile = false;
  userProfile: UserProfile = {
    name: '',
    email: '',
    avatarUrl:
      'https://static-00.iconduck.com/assets.00/avatar-default-icon-2048x2048-h6w375ur.png',
  };
  isAuthenticated = false;
  private authSubscription?: Subscription;
  private readonly isBrowser: boolean;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.checkScreenSize();
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (this.isBrowser) {
      this.checkScreenSize();
    }
  }

  private checkScreenSize() {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth <= 768;
    }
  }

  ngOnInit(): void {
    // Subscribe to auth state changes
    this.authSubscription = this.authService.user$.subscribe((user) => {
      if (user) {
        this.isAuthenticated = true;
        this.userProfile = {
          name: user.displayName || 'User',
          email: user.email || '',
          avatarUrl: user.photoURL || 'assets/default-avatar.png',
        };
      } else {
        this.isAuthenticated = false;
        this.userProfile = {
          name: '',
          email: '',
          avatarUrl: 'assets/default-avatar.png',
        };
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleDropdown(): void {
    if (this.isMobile) {
      this.isDropdownOpen = !this.isDropdownOpen;
      this.isMobileMenuOpen = false;
    } else {
      this.isDropdownOpen = !this.isDropdownOpen;
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isDropdownOpen = false;
  }

  navigate(route: string): void {
    if (route === 'logout') {
      this.logout();
    } else if (route === 'auth') {
      this.openAuthModal();
    } else {
      this.router.navigate([route]);
    }
    this.isDropdownOpen = false;
    this.isMobileMenuOpen = false;
  }

  goToProfile(): void {
    if (this.isAuthenticated) {
      this.navigate('profile');
    } else {
      this.openAuthModal();
    }
    this.isDropdownOpen = false;
  }

  async openAuthModal(): Promise<void> {
    const dialogRef = this.dialog.open(AuthModalComponent);
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      // User successfully authenticated
      // The auth state change will automatically update the UI
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  getUserInitials(): string {
    if (!this.userProfile.name) return '';
    return this.userProfile.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isBrowser) return;

    const target = event.target as HTMLElement;
    const profileSection = document.querySelector('.profile-section');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (!profileSection?.contains(target) && !mobileMenu?.contains(target)) {
      this.isDropdownOpen = false;
      this.isMobileMenuOpen = false;
    }
  }
}
