import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

// 1. Get All Published Blogs (with optional category & search filter)
const getAllBlogs = async (query: { category?: string; searchTerm?: string }) => {
  const { category, searchTerm } = query;

  const whereConditions: any = {
    isPublished: true,
  };

  if (category && category !== "All") {
    whereConditions.category = {
      equals: category,
      mode: "insensitive",
    };
  }

  if (searchTerm) {
    whereConditions.OR = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { excerpt: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const blogs = await prisma.blog.findMany({
    where: whereConditions,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      thumbnail: true,
      excerpt: true,
      author: true,
      views: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  return blogs;
};

// 2. Get Single Blog By Slug (Increments views + returns related blogs)
const getBlogBySlug = async (slug: string) => {
  const blog = await prisma.blog.findUnique({
    where: { slug },
  });

  if (!blog || !blog.isPublished) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog article not found");
  }

  // Increment views
  await prisma.blog.update({
    where: { id: blog.id },
    data: { views: { increment: 1 } },
  });

  // Fetch 3 related blogs in same category
  const related = await prisma.blog.findMany({
    where: {
      category: blog.category,
      isPublished: true,
      id: { not: blog.id },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      thumbnail: true,
      publishedAt: true,
    },
  });

  return {
    ...blog,
    views: blog.views + 1,
    related,
  };
};

// 3. Admin: Create Blog
const createBlog = async (payload: {
  title: string;
  category: string;
  thumbnail?: string;
  excerpt: string;
  content: string;
  author?: string;
}) => {
  const slug = payload.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .concat(`-${Date.now().toString().slice(-4)}`);

  const blog = await prisma.blog.create({
    data: {
      title: payload.title,
      slug,
      category: payload.category,
      thumbnail: payload.thumbnail || "/assets/blogs/blog_default.png",
      excerpt: payload.excerpt,
      content: payload.content,
      author: payload.author || "Smvaults Editorial Team",
    },
  });

  return blog;
};

// 4. Admin: Update Blog
const updateBlog = async (id: string, payload: any) => {
  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
  }

  const updated = await prisma.blog.update({
    where: { id },
    data: payload,
  });

  return updated;
};

// 5. Admin: Delete Blog
const deleteBlog = async (id: string) => {
  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
  }

  await prisma.blog.delete({ where: { id } });
  return { message: "Blog article deleted successfully" };
};

export const BlogService = {
  getAllBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
};
