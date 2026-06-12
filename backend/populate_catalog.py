from database import SessionLocal
from models import Category, Service

CATS = [
    ("Печать документов", "печать-документов", "📄", 0),
    ("Полиграфия", "полиграфия", "📰", 1),
    ("Печать фото", "печать-фото", "🖼️", 2),
]

# name, slug, image, price_from, category_slug
ITEMS = [
    ("Копирование и печать", "копирование-и-печать-документов", "/products/docs.jpg", 6, "печать-документов"),
    ("Сканирование", "сканирование-документов", "/products/scan.jpg", 10, "печать-документов"),
    ("Ламинирование", "ламинирование", "/products/lamination.jpg", 50, "печать-документов"),
    ("Брошюровка и переплёт", "переплёт-и-брошюровка", "/products/binding.webp", 120, "печать-документов"),

    ("Визитки", "визитки", "/products/business-card.jpg", 500, "полиграфия"),
    ("Листовки", "листовки", "/products/leaflets.png", 300, "полиграфия"),
    ("Флаеры", "флаеры", "/products/flyers.jpg", 300, "полиграфия"),
    ("Буклеты", "буклеты", "/products/buklety.png", 800, "полиграфия"),
    ("Открытки", "открытки", "/products/postcard.webp", 400, "полиграфия"),
    ("Настольный календарь-домик", "настольный-календарь-домик", "/products/calendar-desk.png", 100, "полиграфия"),
    ("Плакатный календарь", "плакатный-календарь", "/products/calendar-poster.jpg", 230, "полиграфия"),
    ("Карманные календари", "карманные-календари", "/products/calendar-pocket.webp", 8, "полиграфия"),
    ("Перекидной настенный календарь", "перекидной-календарь", "/products/calendar-flip.png", 730, "полиграфия"),
    ("Квартальный календарь", "квартальный-календарь", "/products/calendar-quarterly.jpg", 300, "полиграфия"),
    ("Наклейки и стикеры", "наклейки", "/products/stickers.jpg", 200, "полиграфия"),
    ("Меню для кафе", "меню-для-кафе", "/products/menu.jpg", 600, "полиграфия"),
    ("Блокноты", "блокноты", "/products/notebook.png", 400, "полиграфия"),
    ("Конверты", "конверты", "/products/envelopes.jpg", 16, "полиграфия"),
    ("Грамоты и дипломы", "грамоты-и-дипломы", "/products/diploma.jpg", 55, "полиграфия"),

    ("Печать фотографий", "печать-фотографий", "/products/photo.png", 22, "печать-фото"),
]


def run():
    db = SessionLocal()
    try:
        cat_by_slug = {}
        for name, slug, icon, order in CATS:
            c = db.query(Category).filter(Category.slug == slug).first()
            if not c:
                c = Category(name=name, slug=slug, icon=icon, order=order)
                db.add(c)
            else:
                c.name, c.icon, c.order = name, icon, order
            db.flush()
            cat_by_slug[slug] = c

        for order, (name, slug, image, price, cslug) in enumerate(ITEMS):
            s = db.query(Service).filter(Service.slug == slug).first()
            if not s:
                s = Service(name=name, slug=slug)
                db.add(s)
            s.name = name
            s.image = image
            s.price_from = price
            s.category_id = cat_by_slug[cslug].id
            s.is_active = True
            s.order = order
            db.flush()

        db.commit()
        active = db.query(Service).filter(Service.is_active.is_(True)).count()
        print(f"populated: {len(CATS)} categories, {len(ITEMS)} catalog services (total active: {active})")
    finally:
        db.close()


if __name__ == "__main__":
    run()
