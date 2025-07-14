 Menu Categories & Items
 ### 🎯 Goal

Enable each restaurant to create and manage its own categorized digital menu — with item details and Cloudinary-hosted images.

---

## 🗃️ Database Models (Prisma)

```prisma
model MenuCategory {
  id            String   @id @default(cuid())
  name          String
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id])
  restaurantId  String
  items         MenuItem[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model MenuItem {
  id             String   @id @default(cuid())
  name           String
  description    String?
  price          Float
  imageUrl       String?
  isAvailable    Boolean  @default(true)

  category       MenuCategory @relation(fields: [categoryId], references: [id])
  categoryId     String

  restaurant     Restaurant @relation(fields: [restaurantId], references: [id])
  restaurantId   String

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

⸻

📤 APIs

/api/menu/categories
	•	GET: List all categories for the logged-in restaurant
	•	POST: Create category ({ name })
	•	DELETE: Delete category (only if no items inside)

/api/menu/items
	•	GET: List all items for a restaurant (optional filter by category)
	•	POST: Create item
    {
  name: string,
  description?: string,
  price: number,
  imageUrl?: string,
  categoryId: string
}
	•	PUT: Edit item
	•	DELETE: Delete item
	•	PATCH: Toggle availability (isAvailable)

⸻

🖼️ Cloudinary Image Upload
	•	Use signed upload or preset + unsigned client upload
	•	Store only secure_url in DB as imageUrl
	•	Make image optional

⸻

💻 Frontend: /dashboard/menu

Categories
	•	Add/delete category
	•	Show category list in sidebar or dropdown

Items
	•	Add/edit/delete items per category
	•	Fields: name, price, description, image (upload), availability
	•	Toggle “Available / Unavailable”
	•	Live preview of uploaded image

⸻

✅ What to Build in This Prompt
	•	MenuCategory and MenuItem models
	•	All related API endpoints
	•	Image upload handler for Cloudinary
	•	Full menu manager UI
	•	Category control
	•	Item list and edit form
	•	Cloudinary image support
	•	Toggle availability