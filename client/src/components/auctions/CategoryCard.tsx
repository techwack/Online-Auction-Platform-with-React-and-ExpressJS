import React from 'react';
import { Link } from 'wouter';
import { Category } from '@shared/schema';

type CategoryCardProps = {
  category: Category;
};

const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <Link href={`/category/${category.slug}`}>
      <a className="group">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden aspect-square relative group-hover:shadow-md transition-shadow">
          <img
            src={category.imageUrl || 'https://images.unsplash.com/photo-1560343776-97e7d202ff0e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80'}
            alt={`${category.name} category`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent opacity-75"></div>
          <div className="absolute bottom-0 left-0 p-4">
            <h3 className="text-white text-lg font-semibold">{category.name}</h3>
            <p className="text-neutral-200 text-sm">{category.count || 0} auctions</p>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default CategoryCard;
