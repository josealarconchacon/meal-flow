import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  orderBy,
  DocumentReference,
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject, from, map } from 'rxjs';
import { Recipe } from '../models/recipe.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseRecipeService {
  private firestore: Firestore = inject(Firestore);
  private readonly collectionName = 'recipes';
  private recipesSubject = new BehaviorSubject<Recipe[]>([]);
  public recipes$ = this.recipesSubject.asObservable();

  constructor() {
    this.initializeRealtimeUpdates();
  }

  private initializeRealtimeUpdates() {
    const recipesCollection = collection(this.firestore, this.collectionName);
    const q = query(recipesCollection, orderBy('title', 'asc'));

    collectionData(q, { idField: 'id' }).subscribe(
      (recipes: any[]) => {
        this.recipesSubject.next(recipes as Recipe[]);
      },
      (error) => {
        console.error('Error fetching recipes:', error);
      }
    );
  }

  getRecipes(): Observable<Recipe[]> {
    return this.recipes$;
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      const recipeDoc = doc(this.firestore, this.collectionName, id);
      const recipeSnap = await getDoc(recipeDoc);

      if (recipeSnap.exists()) {
        return { id: recipeSnap.id, ...recipeSnap.data() } as Recipe;
      }
      return null;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }
  }

  async addRecipe(recipe: Omit<Recipe, 'id'>): Promise<string> {
    try {
      const recipesCollection = collection(this.firestore, this.collectionName);
      const recipeWithTimestamp = {
        ...recipe,
        createdAt: Date.now(),
      };
      const docRef = await addDoc(recipesCollection, recipeWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  }

  async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<void> {
    try {
      const recipeDoc = doc(this.firestore, this.collectionName, id);
      await updateDoc(recipeDoc, { ...recipe, updatedAt: Date.now() });
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    try {
      const recipeDoc = doc(this.firestore, this.collectionName, id);
      await deleteDoc(recipeDoc);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }
}
