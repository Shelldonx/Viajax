"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ThumbnailCropper from "@/components/creator/ThumbnailCropper";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Save, ArrowLeft, Trash2 } from "lucide-react";

const CATEGORIES = ["Travel", "Education", "Business", "Health", "Technology", "Finance", "Lifestyle", "General"];

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  cover_image?: string;
  published: boolean;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("General");
  const [published, setPublished] = useState(true);

  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        const p: Product = data.product;
        setTitle(p.title);
        setDescription(p.description || "");
        setPrice(String(p.price));
        setCategory(p.category || "General");
        setPublished(p.published);
        if (p.cover_image) {
          setExistingCover(p.cover_image);
          setThumbnailPreview(p.cover_image);
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchProduct();
  }, [params.id]);

  function handleThumbnailCropped(blob: Blob) {
    setThumbnailBlob(blob);
    setThumbnailPreview(URL.createObjectURL(blob));
    setExistingCover(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      let coverImage: string | null | undefined = undefined;
      if (thumbnailBlob) {
        const reader = new FileReader();
        coverImage = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(thumbnailBlob);
        });
      } else if (!existingCover && !thumbnailPreview) {
        coverImage = null;
      }

      const body: Record<string, unknown> = {
        title,
        description,
        price: parseFloat(price),
        category,
        published,
      };
      if (coverImage !== undefined) {
        body.coverImage = coverImage;
      }

      const res = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Error saving");
      router.push("/dashboard/products");
    } catch (err) {
      alert("Error saving product. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${params.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error deleting");
      router.push("/dashboard/products");
    } catch (err) {
      alert("Error deleting product.");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading product..." />;

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/dashboard/products")}
            className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to products
          </button>
          <h1 className="text-2xl font-bold text-white">Edit Product</h1>
        </div>
        <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="space-y-6">
        <Input id="title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <Input id="price" label="Price (EUR)" type="number" step="0.01" min="0.99" value={price} onChange={(e) => setPrice(e.target.value)} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Cover Thumbnail</label>
          {thumbnailPreview ? (
            <div className="flex items-start gap-4">
              <img src={thumbnailPreview} alt="Cover" className="h-40 w-30 rounded-lg border border-gray-700 object-cover" />
              <button
                onClick={() => { setThumbnailBlob(null); setThumbnailPreview(null); setExistingCover(null); }}
                className="text-sm text-gray-500 hover:text-white"
              >Remove</button>
            </div>
          ) : (
            <ThumbnailCropper onCropped={handleThumbnailCropped} />
          )}
        </div>

        {/* Published toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-teal-500 peer-checked:after:translate-x-full" />
          </label>
          <span className="text-sm text-gray-300">Published on marketplace</span>
        </div>

        <Button fullWidth size="lg" loading={saving} onClick={handleSave}>
          <Save className="h-5 w-5" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
