import Link from "next/link";
import { NavItem } from "@/lib/api";

interface Props {
  items: NavItem[];
}

export default function MainNav({ items }: Props) {
  return (
    <nav aria-label="Категории" className="bg-white border-y border-ink-200">
      <div className="container-page">
        <ul className="flex flex-wrap -mx-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.slug}
                className="inline-flex items-center h-10 px-3 mx-1 text-[13px] font-medium text-ink-700 hover:text-ink-900 hover:bg-ink-100 rounded-md transition-colors whitespace-nowrap"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
