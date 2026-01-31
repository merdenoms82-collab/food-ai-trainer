// ===== APP STATE =====
const appState = {
    currentPage: 'home',
    pantryItems: [],
    selectedCategory: 'all',
    searchQuery: '',
    selectedStaples: new Set(),
    availableStaples: [],
    recipes: [],
    userRecipes: [],
    favoriteRecipes: [],
    shoppingList: [],
    mealPlan: {},
    coupons: [],
    isFirstVisit: true,
    deferredPrompt: null
};

// ===== PANTRY STAPLES DATABASE =====
const pantryStaplesDatabase = [
    { id: 'salt', name: 'Salt', category: 'spices', emoji: '🧂', expiryDays: 9999, unit: 'container' },
    { id: 'pepper', name: 'Black Pepper', category: 'spices', emoji: '🌶️', expiryDays: 9999, unit: 'container' },
    { id: 'garlic_powder', name: 'Garlic Powder', category: 'spices', emoji: '🧄', expiryDays: 365, unit: 'jar' },
    { id: 'onion_powder', name: 'Onion Powder', category: 'spices', emoji: '🧅', expiryDays: 365, unit: 'jar' },
    { id: 'paprika', name: 'Paprika', category: 'spices', emoji: '🌶️', expiryDays: 365, unit: 'jar' },
    { id: 'cumin', name: 'Cumin', category: 'spices', emoji: '🌿', expiryDays: 365, unit: 'jar' },
    { id: 'cinnamon', name: 'Cinnamon', category: 'spices', emoji: '🍂', expiryDays: 365, unit: 'jar' },
    { id: 'oregano', name: 'Oregano', category: 'spices', emoji: '🌿', expiryDays: 365, unit: 'jar' },
    { id: 'basil', name: 'Basil', category: 'spices', emoji: '🌿', expiryDays: 365, unit: 'jar' },
    { id: 'thyme', name: 'Thyme', category: 'spices', emoji: '🌿', expiryDays: 365, unit: 'jar' },
    
    { id: 'olive_oil', name: 'Olive Oil', category: 'oils', emoji: '🫒', expiryDays: 730, unit: 'bottle' },
    { id: 'vegetable_oil', name: 'Vegetable Oil', category: 'oils', emoji: '🫙', expiryDays: 730, unit: 'bottle' },
    { id: 'soy_sauce', name: 'Soy Sauce', category: 'oils', emoji: '🍶', expiryDays: 1095, unit: 'bottle' },
    { id: 'vinegar', name: 'Vinegar', category: 'oils', emoji: '🫙', expiryDays: 1825, unit: 'bottle' },
    
    { id: 'flour', name: 'All-Purpose Flour', category: 'baking', emoji: '🌾', expiryDays: 365, unit: 'bag' },
    { id: 'sugar', name: 'White Sugar', category: 'baking', emoji: '🍚', expiryDays: 9999, unit: 'bag' },
    { id: 'baking_powder', name: 'Baking Powder', category: 'baking', emoji: '🥄', expiryDays: 365, unit: 'container' },
    { id: 'baking_soda', name: 'Baking Soda', category: 'baking', emoji: '🧪', expiryDays: 9999, unit: 'box' },
    { id: 'vanilla', name: 'Vanilla Extract', category: 'baking', emoji: '🌿', expiryDays: 1825, unit: 'bottle' },
    
    { id: 'canned_tomatoes', name: 'Canned Tomatoes', category: 'canned', emoji: '🍅', expiryDays: 1095, unit: 'can' },
    { id: 'canned_beans', name: 'Canned Beans', category: 'canned', emoji: '🫘', expiryDays: 1095, unit: 'can' },
    { id: 'canned_tuna', name: 'Canned Tuna', category: 'canned', emoji: '🐟', expiryDays: 1095, unit: 'can' },
    { id: 'tomato_paste', name: 'Tomato Paste', category: 'canned', emoji: '🥫', expiryDays: 730, unit: 'can' },
    
    { id: 'rice', name: 'Rice', category: 'grains', emoji: '🍚', expiryDays: 1825, unit: 'bag' },
    { id: 'pasta', name: 'Pasta', category: 'grains', emoji: '🍝', expiryDays: 730, unit: 'box' },
    { id: 'oats', name: 'Rolled Oats', category: 'grains', emoji: '🥣', expiryDays: 365, unit: 'container' },
    { id: 'quinoa', name: 'Quinoa', category: 'grains', emoji: '🌾', expiryDays: 365, unit: 'bag' },
    
    { id: 'honey', name: 'Honey', category: 'sweets', emoji: '🍯', expiryDays: 9999, unit: 'jar' },
    { id: 'jam', name: 'Jam/Jelly', category: 'sweets', emoji: '🍓', expiryDays: 365, unit: 'jar' },
    { id: 'peanut_butter', name: 'Peanut Butter', category: 'sweets', emoji: '🥜', expiryDays: 365, unit: 'jar' },
    
    { id: 'ketchup', name: 'Ketchup', category: 'condiments', emoji: '🍅', expiryDays: 365, unit: 'bottle' },
    { id: 'mustard', name: 'Mustard', category: 'condiments', emoji: '🌭', expiryDays: 365, unit: 'bottle' },
    { id: 'mayonnaise', name: 'Mayonnaise', category: 'condiments', emoji: '🥪', expiryDays: 180, unit: 'jar' },
    { id: 'hot_sauce', name: 'Hot Sauce', category: 'condiments', emoji: '🌶️', expiryDays: 730, unit: 'bottle' },
    
    { id: 'coffee', name: 'Coffee', category: 'beverages', emoji: '☕', expiryDays: 365, unit: 'bag' },
    { id: 'tea', name: 'Tea Bags', category: 'beverages', emoji: '🍵', expiryDays: 730, unit: 'box' },
    
    { id: 'crackers', name: 'Crackers', category: 'snacks', emoji: '🍘', expiryDays: 180, unit: 'box' },
    { id: 'chips', name: 'Potato Chips', category: 'snacks', emoji: '🥔', expiryDays: 90, unit: 'bag' },
    { id: 'popcorn', name: 'Popcorn Kernels', category: 'snacks', emoji: '🍿', expiryDays: 365, unit: 'bag' }
];

// ===== RECIPES DATABASE =====
const recipesDatabase = [
    {
        id: 'scrambled_eggs',
        name: 'Scrambled Eggs',
        emoji: '🍳',
        description: 'Quick and fluffy scrambled eggs',
        prepTime: '5 min',
        cookTime: '5 min',
        difficulty: 'Easy',
        matchPercentage: 95,
        favorite: false,
        ingredients: [
            { name: 'Eggs', emoji: '🥚', amount: '2', unit: 'pieces' },
            { name: 'Salt', emoji: '🧂', amount: '1/4', unit: 'tsp' },
            { name: 'Pepper', emoji: '🌶️', amount: '1/8', unit: 'tsp' },
            { name: 'Butter', emoji: '🧈', amount: '1', unit: 'tbsp' },
            { name: 'Milk', emoji: '🥛', amount: '1', unit: 'tbsp', optional: true }
        ],
        instructions: [
            'Crack eggs into a bowl and whisk with salt and pepper',
            'Heat butter in a non-stick pan over medium heat',
            'Pour eggs into pan and let sit for 30 seconds',
            'Gently stir with spatula until cooked to desired consistency',
            'Serve immediately'
        ]
    },
    {
        id: 'pasta_marinara',
        name: 'Pasta Marinara',
        emoji: '🍝',
        description: 'Classic Italian pasta with tomato sauce',
        prepTime: '10 min',
        cookTime: '20 min',
        difficulty: 'Easy',
        matchPercentage: 85,
        favorite: false,
        ingredients: [
            { name: 'Pasta', emoji: '🍝', amount: '200', unit: 'g' },
            { name: 'Canned Tomatoes', emoji: '🍅', amount: '400', unit: 'g' },
            { name: 'Garlic Powder', emoji: '🧄', amount: '1', unit: 'tsp' },
            { name: 'Onion Powder', emoji: '🧅', amount: '1', unit: 'tsp' },
            { name: 'Olive Oil', emoji: '🫒', amount: '2', unit: 'tbsp' },
            { name: 'Salt', emoji: '🧂', amount: '1/2', unit: 'tsp' },
            { name: 'Oregano', emoji: '🌿', amount: '1', unit: 'tsp' }
        ],
        instructions: [
            'Cook pasta according to package directions',
            'Heat olive oil in a saucepan over medium heat',
            'Add garlic and onion powder, cook for 1 minute',
            'Add canned tomatoes and seasonings, simmer for 15 minutes',
            'Mix sauce with cooked pasta and serve'
        ]
    },
    {
        id: 'stir_fry',
        name: 'Vegetable Stir Fry',
        emoji: '🥡',
        description: 'Quick and healthy vegetable stir fry',
        prepTime: '15 min',
        cookTime: '10 min',
        difficulty: 'Medium',
        matchPercentage: 75,
        favorite: false,
        ingredients: [
            { name: 'Rice', emoji: '🍚', amount: '1', unit: 'cup' },
            { name: 'Mixed Vegetables', emoji: '🥦', amount: '2', unit: 'cups' },
            { name: 'Soy Sauce', emoji: '🍶', amount: '2', unit: 'tbsp' },
            { name: 'Garlic Powder', emoji: '🧄', amount: '1', unit: 'tsp' },
            { name: 'Vegetable Oil', emoji: '🫙', amount: '2', unit: 'tbsp' },
            { name: 'Salt', emoji: '🧂', amount: '1/4', unit: 'tsp' },
            { name: 'Pepper', emoji: '🌶️', amount: '1/8', unit: 'tsp' }
        ],
        instructions: [
            'Cook rice according to package directions',
            'Heat oil in a wok or large pan over high heat',
            'Add vegetables and stir-fry for 5-7 minutes',
            'Add garlic powder and seasonings',
            'Add soy sauce and stir for 1 minute',
            'Serve over cooked rice'
        ]
    },
    {
        id: 'pancakes',
        name: 'Fluffy Pancakes',
        emoji: '🥞',
        description: 'Light and fluffy breakfast pancakes',
        prepTime: '10 min',
        cookTime: '15 min',
        difficulty: 'Easy',
        matchPercentage: 80,
        favorite: false,
        ingredients: [
            { name: 'Flour', emoji: '🌾', amount: '1', unit: 'cup' },
            { name: 'Baking Powder', emoji: '🥄', amount: '2', unit: 'tsp' },
            { name: 'Sugar', emoji: '🍚', amount: '2', unit: 'tbsp' },
            { name: 'Salt', emoji: '🧂', amount: '1/4', unit: 'tsp' },
            { name: 'Milk', emoji: '🥛', amount: '3/4', unit: 'cup' },
            { name: 'Eggs', emoji: '🥚', amount: '1', unit: 'piece' },
            { name: 'Vegetable Oil', emoji: '🫙', amount: '2', unit: 'tbsp' },
            { name: 'Vanilla', emoji: '🌿', amount: '1', unit: 'tsp', optional: true }
        ],
        instructions: [
            'Mix dry ingredients in a large bowl',
            'In another bowl, whisk milk, egg, oil, and vanilla',
            'Combine wet and dry ingredients until just mixed',
            'Heat a lightly oiled griddle over medium heat',
            'Pour batter and cook until bubbles form, then flip',
            'Cook until golden brown on both sides'
        ]
    },
    {
        id: 'rice_beans',
        name: 'Rice & Beans',
        emoji: '🍚',
        description: 'Simple and filling rice with beans',
        prepTime: '5 min',
        cookTime: '20 min',
        difficulty: 'Easy',
        matchPercentage: 90,
        favorite: false,
        ingredients: [
            { name: 'Rice', emoji: '🍚', amount: '1', unit: 'cup' },
            { name: 'Canned Beans', emoji: '🫘', amount: '1', unit: 'can' },
            { name: 'Salt', emoji: '🧂', amount: '1/2', unit: 'tsp' },
            { name: 'Garlic Powder', emoji: '🧄', amount: '1', unit: 'tsp' },
            { name: 'Onion Powder', emoji: '🧅', amount: '1', unit: 'tsp' },
            { name: 'Cumin', emoji: '🌿', amount: '1/2', unit: 'tsp' }
        ],
        instructions: [
            'Cook rice according to package directions',
            'Rinse and drain canned beans',
            'Heat beans in a saucepan with seasonings',
            'Simmer for 10 minutes to combine flavors',
            'Serve beans over cooked rice'
        ]
    },
    {
        id: 'tomato_soup',
        name: 'Creamy Tomato Soup',
        emoji: '🍅',
        description: 'Comforting tomato soup for any day',
        prepTime: '5 min',
        cookTime: '15 min',
        difficulty: 'Easy',
        matchPercentage: 85,
        favorite: false,
        ingredients: [
            { name: 'Canned Tomatoes', emoji: '🍅', amount: '2', unit: 'cans' },
            { name: 'Onion Powder', emoji: '🧅', amount: '1', unit: 'tsp' },
            { name: 'Garlic Powder', emoji: '🧄', amount: '1', unit: 'tsp' },
            { name: 'Basil', emoji: '🌿', amount: '1', unit: 'tsp' },
            { name: 'Salt', emoji: '🧂', amount: '1/2', unit: 'tsp' },
            { name: 'Pepper', emoji: '🌶️', amount: '1/4', unit: 'tsp' },
            { name: 'Cream or Milk', emoji: '🥛', amount: '1/2', unit: 'cup', optional: true }
        ],
        instructions: [
            'Blend canned tomatoes until smooth',
            'Pour into saucepan and add seasonings',
            'Simmer for 15 minutes over medium heat',
            'Stir in cream or milk if using',
            'Heat through and serve hot'
        ]
    },
    {
        id: 'overnight_oats',
        name: 'Overnight Oats',
        emoji: '🥣',
        description: 'No-cook breakfast ready in the morning',
        prepTime: '5 min',
        cookTime: '0 min',
        difficulty: 'Easy',
        matchPercentage: 95,
        favorite: false,
        ingredients: [
            { name: 'Rolled Oats', emoji: '🥣', amount: '1/2', unit: 'cup' },
            { name: 'Milk', emoji: '🥛', amount: '1/2', unit: 'cup' },
            { name: 'Honey', emoji: '🍯', amount: '1', unit: 'tbsp' },
            { name: 'Cinnamon', emoji: '🍂', amount: '1/4', unit: 'tsp' },
            { name: 'Salt', emoji: '🧂', amount: 'Pinch', unit: '' },
            { name: 'Jam/Jelly', emoji: '🍓', amount: '1', unit: 'tbsp', optional: true }
        ],
        instructions: [
            'Mix all ingredients in a jar or bowl',
            'Cover and refrigerate overnight',
            'Stir well in the morning',
            'Add fresh fruit or nuts if available',
            'Serve cold'
        ]
    },
    {
        id: 'garlic_bread',
        name: 'Garlic Bread',
        emoji: '🍞',
        description: 'Simple garlic bread side dish',
        prepTime: '5 min',
        cookTime: '10 min',
        difficulty: 'Easy',
        matchPercentage: 70,
        favorite: false,
        ingredients: [
            { name: 'Bread', emoji: '🍞', amount: '4', unit: 'slices' },
            { name: 'Garlic Powder', emoji: '🧄', amount: '1', unit: 'tsp' },
            { name: 'Butter', emoji: '🧈', amount: '4', unit: 'tbsp' },
            { name: 'Salt', emoji: '🧂', amount: '1/4', unit: 'tsp' },
            { name: 'Oregano', emoji: '🌿', amount: '1/2', unit: 'tsp' }
        ],
        instructions: [
            'Mix softened butter with garlic powder and herbs',
            'Spread evenly on bread slices',
            'Place on baking sheet',
            'Broil for 3-5 minutes until golden',
            'Watch carefully to avoid burning'
        ]
    }
];

// ===== COUPON SERVICE (Mock) =====
class CouponService {
    constructor() {
        this.coupons = [
            { id: 'coupon1', item: 'Eggs', store: 'Walmart', discount: '$1.50 off', expiry: '7 days', savings: 1.50 },
            { id: 'coupon2', item: 'Milk', store: 'Walmart', discount: '$0.75 off', expiry: '5 days', savings: 0.75 },
            { id: 'coupon3', item: 'Bread', store: 'Walmart', discount: 'Buy 1 Get 1 Free', expiry: '3 days', savings: 2.99 },
            { id: 'coupon4', item: 'Vegetables', store: 'Walmart', discount: '20% off', expiry: '10 days', savings: 3.00 },
            { id: 'coupon5', item: 'Pasta', store: 'Walmart', discount: '$0.50 off', expiry: '14 days', savings: 0.50 },
            { id: 'coupon6', item: 'Canned Goods', store: 'Walmart', discount: '15% off', expiry: '30 days', savings: 2.25 }
        ];
    }
    
    async findCoupons(shoppingList) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const shoppingItems = shoppingList.map(item => item.name);
        return this.coupons.filter(coupon => 
            shoppingItems.some(item => 
                item.toLowerCase().includes(coupon.item.toLowerCase()) ||
                coupon.item.toLowerCase().includes(item.toLowerCase())
            )
        );
    }
}

// ===== PANTRY MANAGER =====
class PantryManager {
    constructor() {
        this.storageKey = 'darsnest_pantry';
        this.userRecipesKey = 'darsnest_user_recipes';
        this.favoritesKey = 'darsnest_favorites';
    }
    
    saveItem(item) {
        const items = this.getAllItems();
        const newItem = {
            ...item,
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            addedDate: new Date().toISOString().split('T')[0],
            status: 'fresh'
        };
        items.push(newItem);
        localStorage.setItem(this.storageKey, JSON.stringify(items));
        return newItem;
    }
    
    saveMultipleItems(items) {
        const existingItems = this.getAllItems();
        const newItems = items.map(item => ({
            ...item,
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            addedDate: new Date().toISOString().split('T')[0],
            status: 'fresh'
        }));
        
        const allItems = [...existingItems, ...newItems];
        localStorage.setItem(this.storageKey, JSON.stringify(allItems));
        return newItems;
    }
    
    getAllItems() {
        const items = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        return items;
    }
    
    saveUserRecipe(recipe) {
        const recipes = this.getUserRecipes();
        recipes.push(recipe);
        localStorage.setItem(this.userRecipesKey, JSON.stringify(recipes));
        return recipe;
    }
    
    getUserRecipes() {
        return JSON.parse(localStorage.getItem(this.userRecipesKey) || '[]');
    }
    
    toggleFavorite(recipeId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(recipeId);
        
        if (index === -1) {
            favorites.push(recipeId);
        } else {
            favorites.splice(index, 1);
        }
        
        localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
        return favorites;
    }
    
    getFavorites() {
        return JSON.parse(localStorage.getItem(this.favoritesKey) || '[]');
    }
    
    isFavorite(recipeId) {
        const favorites = this.getFavorites();
        return favorites.includes(recipeId);
    }
}

// ===== SHOPPING LIST MANAGER =====
class ShoppingListManager {
    constructor() {
        this.storageKey = 'darsnest_shopping_list';
    }
    
    getAllItems() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }
    
    saveItem(item) {
        const items = this.getAllItems();
        const newItem = {
            ...item,
            id: 'shop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            completed: false,
            addedDate: new Date().toISOString().split('T')[0]
        };
        items.push(newItem);
        localStorage.setItem(this.storageKey, JSON.stringify(items));
        return newItem;
    }
    
    saveMultipleItems(items) {
        const existingItems = this.getAllItems();
        const newItems = items.map(item => ({
            ...item,
            id: 'shop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            completed: false,
            addedDate: new Date().toISOString().split('T')[0]
        }));
        
        const allItems = [...existingItems, ...newItems];
        localStorage.setItem(this.storageKey, JSON.stringify(allItems));
        return newItems;
    }
    
    toggleItem(itemId) {
        const items = this.getAllItems();
        const updatedItems = items.map(item => {
            if (item.id === itemId) {
                return { ...item, completed: !item.completed };
            }
            return item;
        });
        localStorage.setItem(this.storageKey, JSON.stringify(updatedItems));
        return updatedItems;
    }
    
    removeItem(itemId) {
        const items = this.getAllItems();
        const updatedItems = items.filter(item => item.id !== itemId);
        localStorage.setItem(this.storageKey, JSON.stringify(updatedItems));
        return updatedItems;
    }
    
    clearAll() {
        localStorage.setItem(this.storageKey, '[]');
        return [];
    }
}

// ===== MEAL PLANNER =====
class MealPlanner {
    constructor() {
        this.storageKey = 'darsnest_meal_plan';
    }
    
    generatePlan(pantryItems, recipes) {
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        const today = new Date();
        const plan = {};
        
        // Start planning from today
        days.forEach((day, index) => {
            const planDate = new Date(today);
            planDate.setDate(today.getDate() + index);
            
            // Filter recipes that have high pantry match
            const availableRecipes = recipes.filter(recipe => recipe.matchPercentage >= 70);
            
            if (availableRecipes.length > 0) {
                const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
                
                plan[day] = {
                    date: planDate.toISOString().split('T')[0],
                    recipe: randomRecipe,
                    prepNotes: this.generatePrepNotes(randomRecipe)
                };
            }
        });
        
        localStorage.setItem(this.storageKey, JSON.stringify(plan));
        return plan;
    }
    
    generatePrepNotes(recipe) {
        const notes = [];
        
        if (recipe.prepTime.includes('10') || recipe.prepTime.includes('15')) {
            notes.push('Consider prepping ingredients the night before');
        }
        
        if (recipe.cookTime.includes('20') || recipe.cookTime.includes('30')) {
            notes.push('This meal takes some time to cook, plan accordingly');
        }
        
        if (recipe.ingredients.some(ing => ing.name.toLowerCase().includes('chicken') || ing.name.toLowerCase().includes('meat'))) {
            notes.push('Remember to thaw protein if frozen');
        }
        
        notes.push('Check that all ingredients are available in pantry');
        
        return notes;
    }
    
    getPlan() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }
}

// ===== DARSNEST APP =====
class DarsNestApp {
    constructor() {
        this.pantryManager = new PantryManager();
        this.shoppingManager = new ShoppingListManager();
        this.mealPlanner = new MealPlanner();
        this.couponService = new CouponService();
        this.init();
    }
    
    init() {
        console.log('🚀 DarsNest AI Kitchen OS Initialized');
        
        this.loadAppState();
        this.cacheElements();
        this.bindEvents();
        this.checkFirstVisit();
        this.setupPWA();
        this.updateUI();
    }
    
    loadAppState() {
        appState.pantryItems = this.pantryManager.getAllItems();
        appState.userRecipes = this.pantryManager.getUserRecipes();
        appState.favoriteRecipes = this.pantryManager.getFavorites();
        appState.shoppingList = this.shoppingManager.getAllItems();
        appState.mealPlan = this.mealPlanner.getPlan();
        appState.isFirstVisit = appState.pantryItems.length <= 4; // Only sample items
        
        this.updateAvailableStaples();
        this.generateRecipes();
        this.calculateShoppingSummary();
    }
    
    updateAvailableStaples() {
        const pantryItemNames = appState.pantryItems.map(item => item.name.toLowerCase());
        appState.availableStaples = pantryStaplesDatabase.filter(staple => 
            !pantryItemNames.includes(staple.name.toLowerCase())
        );
    }
    
    generateRecipes() {
        const pantryItemNames = appState.pantryItems.map(item => item.name.toLowerCase());
        
        // Calculate match percentage for each recipe based on pantry items
        appState.recipes = recipesDatabase.map(recipe => {
            const recipeIngredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
            const pantryMatch = recipeIngredientNames.filter(ingredientName => 
                pantryItemNames.some(pantryName => 
                    pantryName.includes(ingredientName) || ingredientName.includes(pantryName)
                )
            ).length;
            
            const matchPercentage = Math.min(100, Math.floor((pantryMatch / recipe.ingredients.length) * 100));
            const isFavorite = this.pantryManager.isFavorite(recipe.id);
            
            return {
                ...recipe,
                matchPercentage,
                favorite: isFavorite
            };
        }).sort((a, b) => b.matchPercentage - a.matchPercentage); // Sort by highest match first
    }
    
    calculateShoppingSummary() {
        const activeItems = appState.shoppingList.filter(item => !item.completed);
        const estimatedCost = activeItems.length * 3.5; // Mock average $3.50 per item
        const estimatedSavings = appState.coupons.reduce((sum, coupon) => sum + coupon.savings, 0);
        
        appState.shoppingSummary = {
            totalItems: activeItems.length,
            estimatedCost: estimatedCost.toFixed(2),
            estimatedSavings: estimatedSavings.toFixed(2)
        };
    }
    
    cacheElements() {
        this.elements = {
            // Pages
            pages: {
                home: document.getElementById('homePage'),
                pantry: document.getElementById('pantryPage'),
                scanner: document.getElementById('scannerPage'),
                recipes: document.getElementById('recipesPage'),
                shopping: document.getElementById('shoppingPage'),
                'meal-planner': document.getElementById('mealPlannerPage')
            },
            
            // Welcome modal
            welcomeModal: document.getElementById('welcomeModal'),
            startOnboardingBtn: document.getElementById('startOnboardingBtn'),
            
            // Tabs
            tabs: document.querySelectorAll('.tab-item'),
            
            // Home page
            actionCards: document.querySelectorAll('.action-card'),
            homePantryItems: document.getElementById('homePantryItems'),
            viewAllBtn: document.getElementById('viewAllBtn'),
            totalItemsCount: document.getElementById('totalItemsCount'),
            freshItemsCount: document.getElementById('freshItemsCount'),
            expiringItemsCount: document.getElementById('expiringItemsCount'),
            expiredItemsCount: document.getElementById('expiredItemsCount'),
            
            // Pantry page
            pantrySearch: document.getElementById('pantrySearch'),
            addItemBtn: document.getElementById('addItemBtn'),
            addMenu: document.getElementById('addMenu'),
            categoryTabs: document.querySelectorAll('.category-tab'),
            pantryGrid: document.getElementById('pantryGrid'),
            
            // Scanner page
            startScanBtn: document.getElementById('startScanBtn'),
            uploadPhotoBtn: document.getElementById('uploadPhotoBtn'),
            scannedItemEmoji: document.getElementById('scannedItemEmoji'),
            
            // Recipes page
            recipesTabs: document.querySelectorAll('.recipes-tab'),
            recipesTabContents: document.querySelectorAll('.recipes-tab-content'),
            recipesGrid: document.getElementById('recipesGrid'),
            myRecipesGrid: document.getElementById('myRecipesGrid'),
            favoritesGrid: document.getElementById('favoritesGrid'),
            addRecipePhotoBtn: document.getElementById('addRecipePhotoBtn'),
            
            // Shopping page
            shoppingList: document.getElementById('shoppingList'),
            findCouponsBtn: document.getElementById('findCouponsBtn'),
            clearShoppingBtn: document.getElementById('clearShoppingBtn'),
            generateShoppingBtn: document.getElementById('generateShoppingBtn'),
            couponsSection: document.getElementById('couponsSection'),
            couponsGrid: document.getElementById('couponsGrid'),
            totalItems: document.getElementById('totalItems'),
            estimatedCost: document.getElementById('estimatedCost'),
            estimatedSavings: document.getElementById('estimatedSavings'),
            
            // Meal planner page
            weekCalendar: document.getElementById('weekCalendar'),
            generateMealPlanBtn: document.getElementById('generateMealPlanBtn'),
            tipsContent: document.getElementById('tipsContent'),
            
            // Modals
            backdrop: document.getElementById('backdrop'),
            pantryStaplesModal: document.getElementById('pantryStaplesModal'),
            closeStaplesModalBtn: document.getElementById('closeStaplesModalBtn'),
            skipStaplesBtn: document.getElementById('skipStaplesBtn'),
            saveStaplesBtn: document.getElementById('saveStaplesBtn'),
            staplesGrid: document.getElementById('staplesGrid'),
            
            recipeModal: document.getElementById('recipeModal'),
            closeRecipeModalBtn: document.getElementById('closeRecipeModalBtn'),
            recipeModalContent: document.getElementById('recipeModalContent'),
            
            recipePhotoModal: document.getElementById('recipePhotoModal'),
            closeRecipePhotoModalBtn: document.getElementById('closeRecipePhotoModalBtn'),
            uploadPhotoTrigger: document.getElementById('uploadPhotoTrigger'),
            recipePhotoInput: document.getElementById('recipePhotoInput'),
            photoPreview: document.getElementById('photoPreview'),
            recipePhotoPreview: document.getElementById('recipePhotoPreview'),
            retakePhotoBtn: document.getElementById('retakePhotoBtn'),
            processRecipePhotoBtn: document.getElementById('processRecipePhotoBtn'),
            digitizingLoader: document.getElementById('digitizingLoader'),
            recipePreview: document.getElementById('recipePreview'),
            
            // PWA
            installBtn: document.getElementById('installBtn'),
            
            // Notification
            notification: document.getElementById('notification'),
            notificationBtn: document.getElementById('notificationBtn')
        };
    }
    
    bindEvents() {
        // Welcome modal
        this.elements.startOnboardingBtn.addEventListener('click', () => {
            this.elements.welcomeModal.classList.remove('active');
            this.openPantryStaplesModal();
        });
        
        // Tab navigation
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const page = tab.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // Recipes tabs
        this.elements.recipesTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.elements.recipesTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                this.elements.recipesTabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tab.dataset.tab + 'Tab') {
                        content.classList.add('active');
                    }
                });
                
                if (tab.dataset.tab === 'my-recipes') {
                    this.updateMyRecipesGrid();
                } else if (tab.dataset.tab === 'favorites') {
                    this.updateFavoritesGrid();
                }
            });
        });
        
        // Home page actions
        this.elements.actionCards.forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                this.handleAction(action);
            });
        });
        
        // Add item button with menu
        this.elements.addItemBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.elements.addMenu.classList.toggle('active');
        });
        
        // Close menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#addItemBtn') && !e.target.closest('#addMenu')) {
                this.elements.addMenu.classList.remove('active');
            }
        });
        
        // Add menu items
        this.elements.addMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                const action = menuItem.dataset.action;
                this.handleAddAction(action);
                this.elements.addMenu.classList.remove('active');
            }
        });
        
        // Pantry staples modal events
        this.elements.closeStaplesModalBtn.addEventListener('click', () => this.closePantryStaplesModal());
        this.elements.skipStaplesBtn.addEventListener('click', () => {
            this.closePantryStaplesModal();
            this.showNotification("You can add pantry staples anytime from the Pantry page!", 'info');
        });
        this.elements.saveStaplesBtn.addEventListener('click', () => this.savePantryStaples());
        
        // Search functionality
        this.elements.pantrySearch.addEventListener('input', (e) => {
            appState.searchQuery = e.target.value.toLowerCase();
            this.updatePantryGrid();
        });
        
        // Category filter
        this.elements.categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.elements.categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                appState.selectedCategory = tab.dataset.category;
                this.updatePantryGrid();
            });
        });
        
        // View all button
        this.elements.viewAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateTo('pantry');
        });
        
        // Scanner
        this.elements.startScanBtn.addEventListener('click', () => {
            this.scanDemoItem();
        });
        
        this.elements.uploadPhotoBtn.addEventListener('click', () => {
            this.openRecipePhotoModal();
        });
        
        // Add recipe photo button
        this.elements.addRecipePhotoBtn.addEventListener('click', () => {
            this.openRecipePhotoModal();
        });
        
        // Recipe photo modal
        this.elements.uploadPhotoTrigger.addEventListener('click', () => {
            this.elements.recipePhotoInput.click();
        });
        
        this.elements.recipePhotoInput.addEventListener('change', (e) => {
            this.handleRecipePhotoUpload(e);
        });
        
        this.elements.retakePhotoBtn.addEventListener('click', () => {
            this.elements.photoPreview.style.display = 'none';
            this.elements.recipePhotoInput.value = '';
            this.elements.uploadPhotoTrigger.textContent = 'Choose Photo';
        });
        
        this.elements.processRecipePhotoBtn.addEventListener('click', () => {
            this.processRecipePhoto();
        });
        
        this.elements.closeRecipePhotoModalBtn.addEventListener('click', () => {
            this.closeRecipePhotoModal();
        });
        
        // Recipe modal close
        this.elements.closeRecipeModalBtn.addEventListener('click', () => this.closeRecipeModal());
        
        // Shopping list buttons
        this.elements.clearShoppingBtn.addEventListener('click', () => this.clearShoppingList());
        this.elements.generateShoppingBtn.addEventListener('click', () => this.generateFromMissingItems());
        this.elements.findCouponsBtn.addEventListener('click', () => this.findCoupons());
        
        // Meal planner
        this.elements.generateMealPlanBtn.addEventListener('click', () => this.generateMealPlan());
        
        // Backdrop click closes all modals
        this.elements.backdrop.addEventListener('click', () => {
            this.closeAllModals();
        });
        
        // Notification button
        this.elements.notificationBtn.addEventListener('click', () => {
            this.showDailyNotification();
        });
        
        // PWA install button
        this.elements.installBtn.addEventListener('click', () => {
            this.installPWA();
        });
    }
    
    checkFirstVisit() {
        if (appState.isFirstVisit) {
            setTimeout(() => {
                this.elements.welcomeModal.classList.add('active');
                this.showNotification("👩‍🍳 Chef Maya: Welcome! Let's set up your pantry first.", 'success');
            }, 1000);
        }
    }
    
    setupPWA() {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is running in standalone mode');
        }
        
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            appState.deferredPrompt = e;
            this.elements.installBtn.style.display = 'flex';
        });
        
        // Check if app is launched from home screen
        window.addEventListener('appinstalled', () => {
            console.log('App installed successfully');
            this.elements.installBtn.style.display = 'none';
            appState.deferredPrompt = null;
        });
    }
    
    installPWA() {
        if (appState.deferredPrompt) {
            appState.deferredPrompt.prompt();
            appState.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                appState.deferredPrompt = null;
                this.elements.installBtn.style.display = 'none';
            });
        }
    }
    
    navigateTo(page) {
        if (appState.currentPage === page) return;
        
        appState.currentPage = page;
        
        this.elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.page === page);
        });
        
        Object.keys(this.elements.pages).forEach(pageKey => {
            const pageElement = this.elements.pages[pageKey];
            if (pageKey === page) {
                pageElement.classList.add('active');
            } else {
                pageElement.classList.remove('active');
            }
        });
        
        if (page === 'pantry') {
            this.updatePantryGrid();
        } else if (page === 'recipes') {
            this.updateRecipesGrid();
        } else if (page === 'shopping') {
            this.updateShoppingList();
            this.calculateShoppingSummary();
            this.updateShoppingSummary();
        } else if (page === 'meal-planner') {
            this.updateMealPlanner();
        }
    }
    
    handleAction(action) {
        switch(action) {
            case 'scan':
                this.navigateTo('scanner');
                break;
            case 'pantry-staples':
                this.openPantryStaplesModal();
                break;
            case 'recipes':
                this.navigateTo('recipes');
                break;
            case 'shopping':
                this.navigateTo('shopping');
                break;
        }
    }
    
    handleAddAction(action) {
        switch(action) {
            case 'pantry-staples':
                this.openPantryStaplesModal();
                break;
            case 'scan':
                this.navigateTo('scanner');
                break;
            case 'recipe-photo':
                this.openRecipePhotoModal();
                break;
        }
    }
    
    openPantryStaplesModal() {
        appState.selectedStaples.clear();
        this.updateAvailableStaples();
        this.populateStaplesGrid();
        
        this.elements.pantryStaplesModal.classList.add('active');
        this.elements.backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    populateStaplesGrid() {
        const staplesGrid = this.elements.staplesGrid;
        staplesGrid.innerHTML = '';
        
        if (appState.availableStaples.length === 0) {
            staplesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                    <div class="empty-icon">✅</div>
                    <div class="empty-title">All staples added!</div>
                    <div class="empty-subtitle">You've already added all pantry staples.</div>
                </div>
            `;
            return;
        }
        
        appState.availableStaples.forEach(staple => {
            const isSelected = appState.selectedStaples.has(staple.id);
            
            const stapleCard = document.createElement('div');
            stapleCard.className = `staple-card ${isSelected ? 'selected' : ''}`;
            stapleCard.dataset.id = staple.id;
            
            stapleCard.innerHTML = `
                <span class="staple-checkmark">
                    <i class="fas fa-check"></i>
                </span>
                <div class="staple-emoji">${staple.emoji}</div>
                <div class="staple-name">${staple.name}</div>
                <div class="staple-details">${staple.unit}</div>
            `;
            
            stapleCard.addEventListener('click', () => {
                this.toggleStapleSelection(staple.id, stapleCard);
            });
            
            staplesGrid.appendChild(stapleCard);
        });
    }
    
    toggleStapleSelection(stapleId, element) {
        if (appState.selectedStaples.has(stapleId)) {
            appState.selectedStaples.delete(stapleId);
            element.classList.remove('selected');
        } else {
            appState.selectedStaples.add(stapleId);
            element.classList.add('selected');
        }
    }
    
    savePantryStaples() {
        const selectedIds = Array.from(appState.selectedStaples);
        
        if (selectedIds.length === 0) {
            this.showNotification('Please select at least one pantry staple', 'warning');
            return;
        }
        
        const itemsToSave = selectedIds.map(id => {
            const staple = pantryStaplesDatabase.find(s => s.id === id);
            const today = new Date();
            const expiryDate = new Date(today);
            expiryDate.setDate(today.getDate() + staple.expiryDays);
            
            return {
                name: staple.name,
                quantity: 1,
                unit: staple.unit,
                category: staple.category,
                emoji: staple.emoji,
                addedDate: today.toISOString().split('T')[0],
                expiryDate: expiryDate.toISOString().split('T')[0],
                status: 'fresh',
                isPantryStaple: true
            };
        });
        
        // Save items
        this.pantryManager.saveMultipleItems(itemsToSave);
        
        // Update app state
        this.loadAppState();
        this.updateUI();
        
        // Close modal and show success
        this.closePantryStaplesModal();
        this.showNotification(`${itemsToSave.length} pantry staples added! ✅`, 'success');
    }
    
    closePantryStaplesModal() {
        this.elements.pantryStaplesModal.classList.remove('active');
        this.elements.backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    openRecipeModal(recipeId) {
        const recipe = [...appState.recipes, ...appState.userRecipes].find(r => r.id === recipeId);
        if (!recipe) return;
        
        const pantryItemNames = appState.pantryItems.map(item => item.name.toLowerCase());
        const isFavorite = this.pantryManager.isFavorite(recipe.id);
        
        const ingredientsList = recipe.ingredients.map(ingredient => {
            const hasIngredient = pantryItemNames.some(pantryName => 
                pantryName.includes(ingredient.name.toLowerCase()) || 
                ingredient.name.toLowerCase().includes(pantryName)
            );
            
            return `
                <div class="ingredient-item">
                    <div class="ingredient-emoji">${ingredient.emoji}</div>
                    <div class="ingredient-name">${ingredient.amount} ${ingredient.unit} ${ingredient.name} ${ingredient.optional ? '(optional)' : ''}</div>
                    <div class="ingredient-status ${hasIngredient ? 'status-in-pantry' : 'status-missing'}">
                        ${hasIngredient ? 'In pantry' : 'Missing'}
                    </div>
                    ${!hasIngredient ? `<button class="ingredient-action" data-name="${ingredient.name}" data-amount="${ingredient.amount}" data-unit="${ingredient.unit}" data-emoji="${ingredient.emoji}">Add to List</button>` : ''}
                </div>
            `;
        }).join('');
        
        const instructionsList = recipe.instructions.map((instruction, index) => `
            <li class="instruction-step">${instruction}</li>
        `).join('');
        
        const favoriteButton = isFavorite ? 
            `<button class="btn btn-secondary" id="unfavoriteRecipeBtn">
                <i class="fas fa-heart"></i>
                Remove from Favorites
            </button>` :
            `<button class="btn btn-secondary" id="favoriteRecipeBtn">
                <i class="far fa-heart"></i>
                Add to Favorites
            </button>`;
        
        this.elements.recipeModalContent.innerHTML = `
            <div class="recipe-header">
                <div class="recipe-emoji-large">${recipe.emoji}</div>
                <div class="recipe-title">${recipe.name}</div>
                <div class="recipe-subtitle">${recipe.description}</div>
                <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 20px;">
                    <div style="background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: var(--radius-full); font-size: 0.9rem;">
                        <i class="fas fa-clock"></i> ${recipe.prepTime} prep
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: var(--radius-full); font-size: 0.9rem;">
                        <i class="fas fa-fire"></i> ${recipe.cookTime} cook
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: var(--radius-full); font-size: 0.9rem;">
                        <i class="fas fa-signal"></i> ${recipe.difficulty}
                    </div>
                </div>
            </div>
            
            <div class="ingredients-section">
                <div class="section-title">
                    <i class="fas fa-carrot"></i>
                    Ingredients ${recipe.matchPercentage ? `(${recipe.matchPercentage}% match)` : ''}
                </div>
                <div class="ingredients-list">
                    ${ingredientsList}
                </div>
            </div>
            
            <div class="instructions-section">
                <div class="section-title">
                    <i class="fas fa-list-ol"></i>
                    Instructions
                </div>
                <ol class="instructions-list">
                    ${instructionsList}
                </ol>
            </div>
            
            <div class="recipe-actions">
                ${favoriteButton}
                <button class="btn btn-primary" id="addAllMissingBtn" style="flex: 1;">
                    <i class="fas fa-cart-plus"></i>
                    Add Missing to Shopping List
                </button>
            </div>
        `;
        
        // Add event listeners to "Add to List" buttons
        this.elements.recipeModalContent.querySelectorAll('.ingredient-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const ingredient = {
                    name: button.dataset.name,
                    amount: button.dataset.amount,
                    unit: button.dataset.unit,
                    emoji: button.dataset.emoji,
                    source: `From: ${recipe.name}`
                };
                this.addToShoppingList(ingredient);
                e.target.textContent = 'Added!';
                e.target.disabled = true;
                setTimeout(() => {
                    e.target.textContent = 'Add to List';
                    e.target.disabled = false;
                }, 1000);
            });
        });
        
        // Favorite button
        const favoriteBtn = document.getElementById('favoriteRecipeBtn') || document.getElementById('unfavoriteRecipeBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                this.toggleFavoriteRecipe(recipe.id);
            });
        }
        
        // Add event listener to "Add All Missing" button
        document.getElementById('addAllMissingBtn').addEventListener('click', () => {
            const missingIngredients = recipe.ingredients.filter(ingredient => {
                const hasIngredient = pantryItemNames.some(pantryName => 
                    pantryName.includes(ingredient.name.toLowerCase()) || 
                    ingredient.name.toLowerCase().includes(pantryName)
                );
                return !hasIngredient && !ingredient.optional;
            });
            
            missingIngredients.forEach(ingredient => {
                this.addToShoppingList({
                    name: ingredient.name,
                    amount: ingredient.amount,
                    unit: ingredient.unit,
                    emoji: ingredient.emoji,
                    source: `From: ${recipe.name}`
                });
            });
            
            this.showNotification(`${missingIngredients.length} items added to shopping list!`, 'success');
            this.closeRecipeModal();
            this.navigateTo('shopping');
        });
        
        this.elements.recipeModal.classList.add('active');
        this.elements.backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    toggleFavoriteRecipe(recipeId) {
        this.pantryManager.toggleFavorite(recipeId);
        this.loadAppState();
        
        // Update UI
        this.updateRecipesGrid();
        this.updateFavoritesGrid();
        
        const isFavorite = this.pantryManager.isFavorite(recipeId);
        this.showNotification(
            isFavorite ? 'Added to favorites!' : 'Removed from favorites',
            'success'
        );
        
        // Update the favorite button in the modal if it's open
        const favoriteBtn = document.getElementById('favoriteRecipeBtn') || document.getElementById('unfavoriteRecipeBtn');
        if (favoriteBtn) {
            if (isFavorite) {
                favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
                favoriteBtn.id = 'unfavoriteRecipeBtn';
            } else {
                favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Add to Favorites';
                favoriteBtn.id = 'favoriteRecipeBtn';
            }
        }
    }
    
    closeRecipeModal() {
        this.elements.recipeModal.classList.remove('active');
        this.elements.backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    openRecipePhotoModal() {
        this.elements.recipePhotoModal.classList.add('active');
        this.elements.backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeRecipePhotoModal() {
        this.elements.recipePhotoModal.classList.remove('active');
        this.elements.backdrop.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset photo modal
        this.elements.photoPreview.style.display = 'none';
        this.elements.recipePhotoInput.value = '';
        this.elements.uploadPhotoTrigger.textContent = 'Choose Photo';
    }
    
    handleRecipePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.recipePhotoPreview.src = e.target.result;
            this.elements.photoPreview.style.display = 'block';
            this.elements.uploadPhotoTrigger.textContent = 'Change Photo';
        };
        reader.readAsDataURL(file);
    }
    
    processRecipePhoto() {
        // Show loading state
        this.elements.photoPreview.style.display = 'none';
        this.elements.digitizingLoader.style.display = 'block';
        
        // Simulate AI processing delay
        setTimeout(() => {
            this.elements.digitizingLoader.style.display = 'none';
            
            // Create a mock digitized recipe
            const digitizedRecipe = {
                id: 'user_' + Date.now(),
                name: 'Digitized Recipe',
                emoji: '📸',
                description: 'Digitized from your photo',
                prepTime: '15 min',
                cookTime: '30 min',
                difficulty: 'Medium',
                ingredients: [
                    { name: 'Flour', emoji: '🌾', amount: '2', unit: 'cups' },
                    { name: 'Sugar', emoji: '🍚', amount: '1', unit: 'cup' },
                    { name: 'Eggs', emoji: '🥚', amount: '3', unit: 'pieces' },
                    { name: 'Butter', emoji: '🧈', amount: '1/2', unit: 'cup' }
                ],
                instructions: [
                    'Preheat oven to 350°F (175°C)',
                    'Mix dry ingredients in a bowl',
                    'Add wet ingredients and mix until combined',
                    'Pour into prepared pan and bake for 30 minutes',
                    'Let cool before serving'
                ]
            };
            
            // Save the recipe
            this.pantryManager.saveUserRecipe(digitizedRecipe);
            this.loadAppState();
            
            // Show success and close modal
            this.showNotification('Recipe digitized and saved!', 'success');
            this.closeRecipePhotoModal();
            
            // Navigate to My Recipes tab
            this.navigateTo('recipes');
            setTimeout(() => {
                const myRecipesTab = document.querySelector('.recipes-tab[data-tab="my-recipes"]');
                if (myRecipesTab) {
                    myRecipesTab.click();
                }
            }, 100);
        }, 2000);
    }
    
    closeAllModals() {
        this.closePantryStaplesModal();
        this.closeRecipeModal();
        this.closeRecipePhotoModal();
        this.elements.backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    addToShoppingList(item) {
        // Check if item already exists in shopping list
        const existingItem = appState.shoppingList.find(shopItem => 
            shopItem.name.toLowerCase() === item.name.toLowerCase() && !shopItem.completed
        );
        
        if (existingItem) {
            this.showNotification(`${item.name} is already in your shopping list!`, 'info');
            return;
        }
        
        // Add to shopping list
        const shoppingItem = {
            name: item.name,
            amount: item.amount,
            unit: item.unit,
            emoji: item.emoji,
            source: item.source || 'Added manually',
            category: 'groceries'
        };
        
        this.shoppingManager.saveItem(shoppingItem);
        this.loadAppState();
        this.updateShoppingList();
        this.calculateShoppingSummary();
        this.updateShoppingSummary();
        
        this.showNotification(`Added ${item.name} to shopping list!`, 'success');
    }
    
    toggleShoppingItem(itemId) {
        appState.shoppingList = this.shoppingManager.toggleItem(itemId);
        this.updateShoppingList();
        this.calculateShoppingSummary();
        this.updateShoppingSummary();
    }
    
    removeShoppingItem(itemId) {
        appState.shoppingList = this.shoppingManager.removeItem(itemId);
        this.updateShoppingList();
        this.calculateShoppingSummary();
        this.updateShoppingSummary();
        this.showNotification('Item removed from shopping list', 'info');
    }
    
    clearShoppingList() {
        if (appState.shoppingList.length === 0) {
            this.showNotification('Shopping list is already empty', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to clear all items from the shopping list?')) {
            appState.shoppingList = this.shoppingManager.clearAll();
            this.updateShoppingList();
            this.calculateShoppingSummary();
            this.updateShoppingSummary();
            this.showNotification('Shopping list cleared!', 'success');
        }
    }
    
    async findCoupons() {
        this.showNotification('Looking for coupons...', 'info');
        
        try {
            const coupons = await this.couponService.findCoupons(appState.shoppingList);
            appState.coupons = coupons;
            
            if (coupons.length > 0) {
                this.updateCouponsGrid();
                this.elements.couponsSection.style.display = 'block';
                this.showNotification(`Found ${coupons.length} coupons!`, 'success');
            } else {
                this.showNotification('No coupons found for your items', 'info');
            }
        } catch (error) {
            this.showNotification('Error finding coupons', 'error');
        }
        
        this.calculateShoppingSummary();
        this.updateShoppingSummary();
    }
    
    updateCouponsGrid() {
        const couponsGrid = this.elements.couponsGrid;
        couponsGrid.innerHTML = '';
        
        appState.coupons.forEach(coupon => {
            const couponCard = document.createElement('div');
            couponCard.className = 'coupon-card';
            couponCard.innerHTML = `
                <div class="coupon-title">${coupon.item}</div>
                <div class="coupon-details">${coupon.store} • ${coupon.discount}</div>
                <div class="coupon-savings">Save $${coupon.savings.toFixed(2)}</div>
            `;
            couponsGrid.appendChild(couponCard);
        });
    }
    
    generateFromMissingItems() {
        const pantryItemNames = appState.pantryItems.map(item => item.name.toLowerCase());
        const shoppingItemNames = appState.shoppingList.map(item => item.name.toLowerCase());
        
        let itemsAdded = 0;
        
        // Check all recipes for missing ingredients
        [...appState.recipes, ...appState.userRecipes].forEach(recipe => {
            recipe.ingredients.forEach(ingredient => {
                if (ingredient.optional) return;
                
                const hasInPantry = pantryItemNames.some(pantryName => 
                    pantryName.includes(ingredient.name.toLowerCase()) || 
                    ingredient.name.toLowerCase().includes(pantryName)
                );
                
                const hasInShopping = shoppingItemNames.includes(ingredient.name.toLowerCase());
                
                if (!hasInPantry && !hasInShopping) {
                    this.addToShoppingList({
                        name: ingredient.name,
                        amount: ingredient.amount,
                        unit: ingredient.unit,
                        emoji: ingredient.emoji,
                        source: 'Auto-generated from recipes'
                    });
                    itemsAdded++;
                }
            });
        });
        
        if (itemsAdded === 0) {
            this.showNotification('All recipe ingredients are already in pantry or shopping list!', 'info');
        } else {
            this.showNotification(`Added ${itemsAdded} missing items to shopping list!`, 'success');
        }
    }
    
    scanDemoItem() {
        const freshFoods = [
            { name: 'Apple', emoji: '🍎', category: 'fruit', expiryDays: 14, unit: 'pieces' },
            { name: 'Banana', emoji: '🍌', category: 'fruit', expiryDays: 7, unit: 'bunch' },
            { name: 'Tomato', emoji: '🍅', category: 'vegetable', expiryDays: 10, unit: 'pieces' },
            { name: 'Milk', emoji: '🥛', category: 'dairy', expiryDays: 7, unit: 'liters' },
            { name: 'Chicken Breast', emoji: '🍗', category: 'meat', expiryDays: 3, unit: 'lbs' },
            { name: 'Bread', emoji: '🍞', category: 'bakery', expiryDays: 5, unit: 'loaf' }
        ];
        
        const randomItem = freshFoods[Math.floor(Math.random() * freshFoods.length)];
        
        // Update scanner display
        this.elements.scannedItemEmoji.textContent = randomItem.emoji;
        
        const today = new Date();
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + randomItem.expiryDays);
        
        const item = {
            name: randomItem.name,
            quantity: 1,
            unit: randomItem.unit,
            category: randomItem.category,
            emoji: randomItem.emoji,
            addedDate: today.toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
            status: 'fresh',
            scanned: true
        };
        
        // Save item
        this.pantryManager.saveItem(item);
        
        // Update app state
        this.loadAppState();
        this.updateUI();
        
        // Show success
        this.showNotification(`Scanned: ${randomItem.name} ${randomItem.emoji}`, 'success');
        
        // Navigate to pantry to see the new item
        setTimeout(() => {
            this.navigateTo('pantry');
        }, 1500);
    }
    
    generateMealPlan() {
        appState.mealPlan = this.mealPlanner.generatePlan(appState.pantryItems, appState.recipes);
        this.updateMealPlanner();
        this.showNotification('Weekly meal plan generated!', 'success');
    }
    
    showDailyNotification() {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        const todayPlan = appState.mealPlan[today];
        
        if (todayPlan) {
            const notificationText = `Today's Menu: ${todayPlan.recipe.name} ${todayPlan.recipe.emoji}`;
            const prepTips = todayPlan.prepNotes.join('\n• ');
            const fullMessage = `${notificationText}\n\nPrep Tips:\n• ${prepTips}`;
            
            if (confirm(fullMessage + '\n\nWould you like to view the recipe?')) {
                this.openRecipeModal(todayPlan.recipe.id);
            }
        } else {
            this.showNotification('No meal plan for today. Generate a plan first!', 'info');
        }
    }
    
    updateUI() {
        this.updateStats();
        this.updateHomePreview();
        this.updatePantryGrid();
        this.updateRecipesGrid();
        this.updateMyRecipesGrid();
        this.updateFavoritesGrid();
        this.updateShoppingList();
        this.updateShoppingSummary();
        this.updateMealPlanner();
    }
    
    updateStats() {
        const totalItems = appState.pantryItems.length;
        let freshItems = 0;
        let expiringItems = 0;
        let expiredItems = 0;
        
        const today = new Date();
        
        appState.pantryItems.forEach(item => {
            const expiryDate = new Date(item.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 0) {
                expiredItems++;
            } else if (daysUntilExpiry <= 3) {
                expiringItems++;
            } else {
                freshItems++;
            }
        });
        
        this.elements.totalItemsCount.textContent = totalItems;
        this.elements.freshItemsCount.textContent = freshItems;
        this.elements.expiringItemsCount.textContent = expiringItems;
        this.elements.expiredItemsCount.textContent = expiredItems;
    }
    
    updateHomePreview() {
        const container = this.elements.homePantryItems;
        const recentItems = appState.pantryItems.slice(-4).reverse();
        
        if (recentItems.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                    <div class="empty-icon">📦</div>
                    <div class="empty-title">No items yet</div>
                    <div class="empty-subtitle">Add pantry staples or scan fresh items!</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recentItems.map(item => {
            const expiryDate = new Date(item.expiryDate);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            
            let width = 100;
            let gradient = 'var(--success-gradient)';
            
            if (daysUntilExpiry <= 0) {
                width = 100;
                gradient = 'var(--danger-gradient)';
            } else if (daysUntilExpiry <= 3) {
                width = 30;
                gradient = 'var(--warning-gradient)';
            } else if (daysUntilExpiry <= 7) {
                width = 70;
                gradient = 'var(--warning-gradient)';
            }
            
            return `
                <div class="pantry-item">
                    <div class="item-category">${item.category}</div>
                    <div class="item-name">${item.name} ${item.emoji}</div>
                    <div class="item-details">${item.quantity} ${item.unit} · ${daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}</div>
                    <div class="expiry-bar">
                        <div class="expiry-fill" style="width: ${width}%; background: ${gradient};"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updatePantryGrid() {
        const container = this.elements.pantryGrid;
        
        let filteredItems = appState.pantryItems.filter(item => {
            if (appState.selectedCategory !== 'all' && item.category !== appState.selectedCategory) {
                return false;
            }
            
            if (appState.searchQuery && !item.name.toLowerCase().includes(appState.searchQuery)) {
                return false;
            }
            
            return true;
        });
        
        if (filteredItems.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div class="empty-icon">📦</div>
                    <div class="empty-title">${appState.searchQuery ? 'No items found' : 'No items yet'}</div>
                    <div class="empty-subtitle">${appState.searchQuery ? 'Try a different search' : 'Add pantry staples or scan fresh items!'}</div>
                </div>
            `;
            return;
        }
        
        const today = new Date();
        
        container.innerHTML = filteredItems.map(item => {
            const expiryDate = new Date(item.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            
            let statusClass = 'status-fresh';
            
            if (daysUntilExpiry <= 0) {
                statusClass = 'status-expired';
            } else if (daysUntilExpiry <= 3) {
                statusClass = 'status-warning';
            }
            
            return `
                <div class="pantry-card">
                    <div class="item-status ${statusClass}"></div>
                    <div class="item-image">${item.emoji}</div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">${item.category} · ${item.quantity} ${item.unit}</div>
                    <div class="item-details" style="color: ${statusClass === 'status-expired' ? '#ef4444' : statusClass === 'status-warning' ? '#f59e0b' : '#22c55e'}; font-weight: 600;">
                        ${daysUntilExpiry > 0 ? `Expires in ${daysUntilExpiry} days` : 'Expired'}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateRecipesGrid() {
        const container = this.elements.recipesGrid;
        
        if (appState.recipes.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div class="empty-icon">🍳</div>
                    <div class="empty-title">No recipes available</div>
                    <div class="empty-subtitle">Add more items to your pantry to see recipe suggestions</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = appState.recipes.map(recipe => {
            let matchColor = '#ef4444';
            if (recipe.matchPercentage >= 80) {
                matchColor = '#22c55e';
            } else if (recipe.matchPercentage >= 60) {
                matchColor = '#f59e0b';
            }
            
            const favoriteIcon = recipe.favorite ? 'fas fa-heart' : 'far fa-heart';
            
            return `
                <div class="recipe-card" data-id="${recipe.id}">
                    <div class="recipe-match" style="background: ${matchColor};">${recipe.matchPercentage}%</div>
                    <div style="position: absolute; top: 12px; left: 12px; color: ${recipe.favorite ? '#ef4444' : 'rgba(255,255,255,0.5)'};">
                        <i class="${favoriteIcon}"></i>
                    </div>
                    <div class="recipe-emoji">${recipe.emoji}</div>
                    <div class="recipe-name">${recipe.name}</div>
                    <div class="recipe-details">${recipe.prepTime} • ${recipe.difficulty}</div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = card.dataset.id;
                this.openRecipeModal(recipeId);
            });
        });
    }
    
    updateMyRecipesGrid() {
        const container = this.elements.myRecipesGrid;
        
        if (appState.userRecipes.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div class="empty-icon">📸</div>
                    <div class="empty-title">No personal recipes yet</div>
                    <div class="empty-subtitle">Add recipes by taking photos of your favorite recipes!</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = appState.userRecipes.map(recipe => {
            const isFavorite = this.pantryManager.isFavorite(recipe.id);
            const favoriteIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
            
            return `
                <div class="recipe-card" data-id="${recipe.id}">
                    <div style="position: absolute; top: 12px; right: 12px; color: ${isFavorite ? '#ef4444' : 'rgba(255,255,255,0.5)'};">
                        <i class="${favoriteIcon}"></i>
                    </div>
                    <div class="recipe-emoji">${recipe.emoji}</div>
                    <div class="recipe-name">${recipe.name}</div>
                    <div class="recipe-details">${recipe.prepTime} • ${recipe.difficulty}</div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = card.dataset.id;
                this.openRecipeModal(recipeId);
            });
        });
    }
    
    updateFavoritesGrid() {
        const container = this.elements.favoritesGrid;
        const favoriteRecipeIds = appState.favoriteRecipes;
        const allRecipes = [...appState.recipes, ...appState.userRecipes];
        const favoriteRecipes = allRecipes.filter(recipe => favoriteRecipeIds.includes(recipe.id));
        
        if (favoriteRecipes.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div class="empty-icon">❤️</div>
                    <div class="empty-title">No favorites yet</div>
                    <div class="empty-subtitle">Add recipes to your favorites by clicking the heart icon</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = favoriteRecipes.map(recipe => {
            return `
                <div class="recipe-card" data-id="${recipe.id}">
                    <div style="position: absolute; top: 12px; right: 12px; color: #ef4444;">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="recipe-emoji">${recipe.emoji}</div>
                    <div class="recipe-name">${recipe.name}</div>
                    <div class="recipe-details">${recipe.prepTime} • ${recipe.difficulty}</div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = card.dataset.id;
                this.openRecipeModal(recipeId);
            });
        });
    }
    
    updateShoppingList() {
        const container = this.elements.shoppingList;
        
        if (appState.shoppingList.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div class="empty-icon">🛒</div>
                    <div class="empty-title">Shopping List Empty</div>
                    <div class="empty-subtitle">Add missing ingredients from recipes or generate automatically</div>
                </div>
            `;
            return;
        }
        
        const activeItems = appState.shoppingList.filter(item => !item.completed);
        const completedItems = appState.shoppingList.filter(item => item.completed);
        
        let html = '';
        
        if (activeItems.length > 0) {
            html += activeItems.map(item => `
                <div class="shopping-item" data-id="${item.id}">
                    <div class="shopping-checkbox">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="shopping-emoji">${item.emoji}</div>
                    <div class="shopping-info">
                        <div class="shopping-name">${item.name}</div>
                        <div class="shopping-details">${item.amount} ${item.unit}</div>
                        <div class="shopping-source">${item.source}</div>
                    </div>
                    <div class="shopping-actions">
                        <button class="shopping-action-btn remove-btn" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        if (completedItems.length > 0) {
            html += `<div style="margin-top: 20px; font-weight: 600; margin-bottom: 12px;">Completed</div>`;
            html += completedItems.map(item => `
                <div class="shopping-item completed" data-id="${item.id}">
                    <div class="shopping-checkbox">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="shopping-emoji">${item.emoji}</div>
                    <div class="shopping-info">
                        <div class="shopping-name">${item.name}</div>
                        <div class="shopping-details">${item.amount} ${item.unit}</div>
                        <div class="shopping-source">${item.source}</div>
                    </div>
                    <div class="shopping-actions">
                        <button class="shopping-action-btn remove-btn" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        container.innerHTML = html;
        
        container.querySelectorAll('.shopping-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const itemId = e.target.closest('.shopping-item').dataset.id;
                this.toggleShoppingItem(itemId);
            });
        });
        
        container.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.closest('.shopping-item').dataset.id;
                this.removeShoppingItem(itemId);
            });
        });
    }
    
    updateShoppingSummary() {
        if (appState.shoppingSummary) {
            this.elements.totalItems.textContent = appState.shoppingSummary.totalItems;
            this.elements.estimatedCost.textContent = `$${appState.shoppingSummary.estimatedCost}`;
            this.elements.estimatedSavings.textContent = `$${appState.shoppingSummary.estimatedSavings}`;
        }
    }
    
    updateMealPlanner() {
        const container = this.elements.weekCalendar;
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        const today = new Date();
        
        // Get current day index (0 = Sunday, 1 = Monday, etc.)
        const currentDayIndex = today.getDay();
        const mondayIndex = currentDayIndex === 0 ? 1 : currentDayIndex - 1;
        
        let html = '';
        
        days.forEach((day, index) => {
            const dayDate = new Date(today);
            dayDate.setDate(today.getDate() + (index - mondayIndex));
            
            const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
            const dateNumber = dayDate.getDate();
            const isToday = dayDate.toDateString() === today.toDateString();
            
            const dayPlan = appState.mealPlan[day];
            const mealName = dayPlan ? dayPlan.recipe.name : 'No meal planned';
            const mealEmoji = dayPlan ? dayPlan.recipe.emoji : '📅';
            
            html += `
                <div class="day-slot ${isToday ? 'active' : ''}" data-day="${day}">
                    <div class="day-name">${dayName}</div>
                    <div class="day-date">${dateNumber}</div>
                    <div class="day-meal">${mealEmoji} ${mealName}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Update prep tips
        const todayDay = today.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        const todayPlan = appState.mealPlan[todayDay];
        
        if (todayPlan) {
            const tipsHtml = `
                <p><strong>${todayPlan.recipe.name}</strong> ${todayPlan.recipe.emoji}</p>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    ${todayPlan.prepNotes.map(note => `<li>${note}</li>`).join('')}
                </ul>
            `;
            this.elements.tipsContent.innerHTML = tipsHtml;
        } else {
            this.elements.tipsContent.innerHTML = '<p>No meal plan generated yet. Click "Generate Plan" to get started!</p>';
        }
        
        // Add click event to day slots
        container.querySelectorAll('.day-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const day = slot.dataset.day;
                const dayPlan = appState.mealPlan[day];
                if (dayPlan) {
                    this.openRecipeModal(dayPlan.recipe.id);
                }
            });
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = this.elements.notification;
        const notificationIcon = notification.querySelector('.notification-icon');
        const notificationText = notification.querySelector('.notification-text');
        
        const iconClass = type === 'success' ? 'fa-check' : 
                         type === 'warning' ? 'fa-exclamation-triangle' : 
                         type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
        
        const bgColor = type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 
                       type === 'warning' ? 'rgba(245, 158, 11, 0.9)' : 
                       type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)';
        
        notification.style.background = bgColor;
        notificationIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
        notificationText.textContent = message;
        
        // Show
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DarsNestApp();
    window.app = app;
});
