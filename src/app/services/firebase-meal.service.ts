import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  deleteDoc,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject, map } from 'rxjs';

export interface MealPlanEntry {
  id?: string;
  recipeId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  userId?: string; // For future authentication implementation
  createdAt?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseMealService {
  private firestore: Firestore = inject(Firestore);
  private readonly collectionName = 'mealPlans';
  private mealPlansSubject = new BehaviorSubject<MealPlanEntry[]>([]);
  public mealPlans$ = this.mealPlansSubject.asObservable();

  constructor() {
    console.log('FirebaseMealService initialized');
    this.initializeRealtimeUpdates();
  }

  private initializeRealtimeUpdates() {
    console.log('Initializing real-time updates for meal plans');
    const mealsCollection = collection(this.firestore, this.collectionName);
    const q = query(mealsCollection, orderBy('date', 'asc'));

    collectionData(q, { idField: 'id' }).subscribe(
      (meals: any[]) => {
        console.log('Received meal plans update:', meals);
        this.mealPlansSubject.next(meals as MealPlanEntry[]);
      },
      (error) => {
        console.error('Error fetching meal plans:', error);
        if (error.code) {
          console.error('Error code:', error.code);
        }
        if (error.message) {
          console.error('Error message:', error.message);
        }
      }
    );
  }

  getMealPlan(): Observable<MealPlanEntry[]> {
    return this.mealPlans$;
  }

  getMealsByDate(date: string): Observable<MealPlanEntry[]> {
    return this.mealPlans$.pipe(
      map((meals) => {
        const filteredMeals = meals.filter((meal) => meal.date === date);
        console.log(`Meals for date ${date}:`, filteredMeals);
        return filteredMeals;
      })
    );
  }

  async addMealToPlan(meal: Omit<MealPlanEntry, 'id'>): Promise<string> {
    try {
      console.log('Adding meal to plan:', meal);
      const mealsCollection = collection(this.firestore, this.collectionName);
      const mealWithTimestamp = {
        ...meal,
        createdAt: Date.now(),
      };
      console.log('Saving meal with timestamp:', mealWithTimestamp);
      const docRef = await addDoc(mealsCollection, mealWithTimestamp);
      console.log('Successfully added meal with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding meal to plan:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  }

  async removeMealFromPlan(mealId: string): Promise<void> {
    try {
      console.log('Removing meal with ID:', mealId);
      const mealDoc = doc(this.firestore, this.collectionName, mealId);
      await deleteDoc(mealDoc);
      console.log('Successfully removed meal:', mealId);
    } catch (error) {
      console.error('Error removing meal from plan:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  }

  async clearMealPlan(): Promise<void> {
    try {
      console.log('Clearing meal plan');
      const currentMeals = this.mealPlansSubject.value;
      console.log('Current meals to clear:', currentMeals);
      const deletePromises = currentMeals.map((meal) =>
        meal.id ? this.removeMealFromPlan(meal.id) : Promise.resolve()
      );
      await Promise.all(deletePromises);
      console.log('Successfully cleared meal plan');
    } catch (error) {
      console.error('Error clearing meal plan:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  }
}
