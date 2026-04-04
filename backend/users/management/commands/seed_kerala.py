import random
from decimal import Decimal
from pathlib import Path
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from menu.models import Category, Cuisine, MenuItem
from orders.models import Cart, CartItem, Order, OrderItem
from payments.models import Payment
from restaurant.models import Restaurant

User = get_user_model()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
LOCAL_IMAGES_DIR = BASE_DIR / 'initial_images'
USE_LOCAL_IMAGES = (LOCAL_IMAGES_DIR / 'cuisines').exists()
DEFAULT_PASSWORD = 'password123'


def get_image_source(subfolder: str, filename: str, fallback_url: str):
    path = LOCAL_IMAGES_DIR / subfolder / filename
    if USE_LOCAL_IMAGES and path.exists():
        return ('local', path)
    return ('url', f'{fallback_url}?q=70&w=800&auto=format&fit=crop')


def apply_image(instance, field_name: str, image_source):
    kind, value = image_source
    if kind == 'local':
        with open(value, 'rb') as image_file:
            getattr(instance, field_name).save(value.name, File(image_file), save=True)
        return
    instance.__class__.objects.filter(pk=instance.pk).update(**{field_name: value})


class Command(BaseCommand):
    help = 'Seed Kerala demo data for admin, restaurant, delivery, and customer workflows.'

    CUISINE_DATA = {
        'Biryani': ('biryani.jpg', 'https://images.unsplash.com/photo-1563379091339-03b21bc4a6f8'),
        'Burger': ('burger.jpg', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'),
        'Pizza': ('pizza.jpg', 'https://images.unsplash.com/photo-1513104890138-7c749659a591'),
        'Mandhi': ('mandhi.jpg', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0'),
        'Seafood': ('seafood.jpg', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2'),
        'Tea & Snacks': ('tea_snacks.jpg', 'https://images.unsplash.com/photo-1544787210-282fd23217c6'),
        'Desserts': ('desserts.jpg', 'https://images.unsplash.com/photo-1551024506-0bccd828d307'),
        'Chinese': ('chinese.jpg', 'https://images.unsplash.com/photo-1512058564366-18510be2db19'),
        'Shawaya': ('shawaya.jpg', 'https://images.unsplash.com/photo-1599481238640-4c1288750d7a'),
        'Breakfast': ('breakfast.jpg', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666'),
        'Veg Specials': ('veg_specials.jpg', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
        'Juices': ('juices.jpg', 'https://images.unsplash.com/photo-1513558161293-cdaf76589fd8'),
        'Italian': ('italian.jpg', 'https://images.unsplash.com/photo-1473093226795-af9932fe5856'),
        'South Indian': ('south_indian.jpg', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8'),
        'North Indian': ('north_indian.jpg', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe'),
    }

    RESTAURANT_BLUEPRINTS = {
        'Kozhikode': [
            ('Calicut Paragon', 'Malabar, Seafood', 'calicut_paragon.jpg', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'),
            ('Rahmath Hotel', 'Malabar, Beef Specialty', 'rahmath.jpg', 'https://images.unsplash.com/photo-1552566626-52f8b828add9'),
            ('Sagar Hotel', 'South Indian, Biryani', 'sagar.jpg', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'),
            ('Zains Hotel', 'Traditional Malabar', 'zains.jpg', 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b'),
            ('Mezban', 'Fine Dining, North Indian', 'mezban.jpg', 'https://images.unsplash.com/photo-1559339352-11d035aa65de'),
            ('Topform', 'Biryani, Non-Veg', 'topform.jpg', 'https://images.unsplash.com/photo-1520201163981-8cc95007dd2a'),
            ('Alakapuri', 'Legendary Malabar', 'alkapuri.jpg', 'https://images.unsplash.com/photo-1511914265872-c40692f694e0'),
            ("King's Mouth", 'Arabian, Chinese', 'kings_mouth.jpg', 'https://images.unsplash.com/photo-1574096079513-d8259312b785'),
            ('Hotel de Choice', 'South Indian, Snacks', 'hotel_de_choice.jpg', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543'),
            ('M-Grill Kozhikode', 'Grill, BBQ, Continental', 'mgrill_kzd.jpg', 'https://images.unsplash.com/photo-1544025162-d76694265947'),
        ],
        'Kochi': [
            ('Dhe Puttu', 'Specialty Puttu', 'dhe_puttu.jpg', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0'),
            ('Paragon Lulu', 'Malabar, Premium', 'paragon_lulu.jpg', 'https://images.unsplash.com/photo-1555396273-367ea474df03'),
            ('Grand Pavilion', 'South Indian, Seafood', 'grand_pavilion.jpg', 'https://images.unsplash.com/photo-1493770348161-369560ae357d'),
            ('Hotel Seagull', 'Coastal, Continental', 'hotel_seagull.jpg', 'https://images.unsplash.com/photo-1551632432-c735e8399521'),
            ('Mullapanthal', 'Traditional Toddy Shop', 'mullapanthal.jpg', 'https://images.unsplash.com/photo-1543353071-873f17a7a088'),
            ('Arippa', 'Nadan Kerala Food', 'arippa.jpg', 'https://images.unsplash.com/photo-1563379091339-03b21bc4a6f8'),
            ('Kashi Art Cafe', 'Continental, European', 'kashi_art.jpg', 'https://images.unsplash.com/photo-1502301103665-0b95cc738def'),
            ('Dal Roti', 'North Indian, Tandoor', 'dal_chili.jpg', 'https://images.unsplash.com/photo-1533777419517-3e4017e2e15a'),
            ('Paragon Kochi', 'Malabar Express', 'paragon_kochi.jpg', 'https://images.unsplash.com/photo-1551632432-c735e8399521'),
            ('Ceylon Bake House', 'Bakery, Cafe', 'ceylon_bake.jpg', 'https://images.unsplash.com/photo-1464306208223-e0b4495a5553'),
        ],
        'Kannur': [
            ('Hotel Othens', 'Legendary Nadan Food', 'hotel_othens.jpg', 'https://images.unsplash.com/photo-1543353071-873f17a7a088'),
            ('Barka', 'Mandhi, Arabian', 'barka.jpg', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0'),
            ('M-Grill Kannur', 'Modern Grill', 'mgrill_kannur.jpg', 'https://images.unsplash.com/photo-1544025162-d76694265947'),
            ('Choice Hotel', 'South Indian', 'choice_hotel.jpg', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'),
            ('Sahara', 'Traditional Arabic', 'sahara.jpg', 'https://images.unsplash.com/photo-1599481238640-4c1288750d7a'),
            ('Onas Kitchen', 'Homemade Kerala', 'onas_kitchen.jpg', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
            ('Raandhal', 'Traditional Kerala', 'raandhal.jpg', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8'),
            ("Sahib's Grill", 'Steaks, BBQ', 'sahib_grill.jpg', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288'),
            ('Soft Drinks', 'Juices, Desserts', 'soft_drinks.jpg', 'https://images.unsplash.com/photo-1513558161293-cdaf76589fd8'),
            ('Cabane Special', 'Fine Dining', 'cabane_special.jpg', 'https://images.unsplash.com/photo-1552566626-52f8b828add9'),
        ],
    }

    CITY_ADDRESSES = {
        'Kozhikode': [
            'SM Street, Kozhikode, Kerala',
            'Mavoor Road, Kozhikode, Kerala',
            'Beach Road, Kozhikode, Kerala',
            'Palayam, Kozhikode, Kerala',
            'Nadakkavu, Kozhikode, Kerala',
            'Eranhipalam, Kozhikode, Kerala',
            'Medical College Junction, Kozhikode, Kerala',
            'Kallai Road, Kozhikode, Kerala',
            'Pavamani Road, Kozhikode, Kerala',
            'Ramanattukara, Kozhikode, Kerala',
        ],
        'Kochi': [
            'MG Road, Kochi, Kerala',
            'Fort Kochi, Kochi, Kerala',
            'Panampilly Nagar, Kochi, Kerala',
            'Edappally, Kochi, Kerala',
            'Kakkanad, Kochi, Kerala',
            'Marine Drive, Kochi, Kerala',
            'Kaloor, Kochi, Kerala',
            'Palarivattom, Kochi, Kerala',
            'Thevara, Kochi, Kerala',
            'Vyttila, Kochi, Kerala',
        ],
        'Kannur': [
            'Talap, Kannur, Kerala',
            'Fort Road, Kannur, Kerala',
            'Thalassery Road, Kannur, Kerala',
            'Payyambalam, Kannur, Kerala',
            'South Bazar, Kannur, Kerala',
            'Pallikunnu, Kannur, Kerala',
            'Mele Chovva, Kannur, Kerala',
            'Thavakkara, Kannur, Kerala',
            'Chakkarakkal, Kannur, Kerala',
            'Kizhunna, Kannur, Kerala',
        ],
    }

    CATEGORY_SETS = {
        'kerala': ['Best Sellers', 'Meals', 'Biryanis', 'Seafood', 'Snacks', 'Beverages', 'Desserts', 'Combos'],
        'arabian': ['Best Sellers', 'Mandhi', 'Alfaham', 'Shawarma', 'Platters', 'Beverages', 'Desserts', 'Combos'],
        'cafe': ['Best Sellers', 'Breakfast', 'Coffee', 'Quick Bites', 'Sandwiches', 'Pasta & Pizza', 'Shakes', 'Desserts'],
        'grill': ['Best Sellers', 'Grill', 'BBQ', 'Burger & Sandwich', 'Rice & Noodles', 'Beverages', 'Desserts', 'Family Meals'],
        'veg': ['Best Sellers', 'South Indian', 'North Indian', 'Curries', 'Rice Bowls', 'Juices', 'Desserts', 'Family Packs'],
    }

    DISHES_BY_CUISINE = {
        'Biryani': ['Chicken Biryani', 'Beef Biryani', 'Mutton Biryani', 'Prawns Biryani', 'Kappa Biryani'],
        'Burger': ['Chicken Burger', 'Beef Burger', 'Cheese Burger', 'Zinger Burger', 'Smoky Grill Burger'],
        'Pizza': ['Margherita Pizza', 'Chicken Tikka Pizza', 'Veggie Supreme Pizza', 'Farmhouse Pizza', 'Pepperoni Pizza'],
        'Mandhi': ['Chicken Mandhi', 'Alfaham Mandhi', 'Mutton Mandhi', 'Kuzhi Mandhi', 'Family Mandhi'],
        'Seafood': ['Fish Curry Meals', 'Karimeen Pollichathu', 'Prawns Roast', 'Squid Fry', 'Fish Molee'],
        'Tea & Snacks': ['Pazham Pori', 'Unnakaya', 'Chicken Cutlet', 'Sulaimani', 'Kattan Chaya'],
        'Desserts': ['Falooda', 'Chocolate Lava', 'Fruit Salad', 'Tender Coconut Pudding', 'Kunafa'],
        'Chinese': ['Chicken Fried Rice', 'Veg Fried Rice', 'Hakka Noodles', 'Chilli Chicken', 'Dragon Chicken'],
        'Shawaya': ['Full Shawaya', 'Half Shawaya', 'Peri Peri Alfaham', 'Shawarma Plate', 'BBQ Chicken'],
        'Breakfast': ['Puttu and Kadala', 'Appam and Stew', 'Masala Dosa', 'Idiyappam and Egg Curry', 'Porotta and Beef Fry'],
        'Veg Specials': ['Veg Meals', 'Paneer Butter Masala', 'Gobi 65', 'Veg Kurma', 'Mushroom Pepper Fry'],
        'Juices': ['Sharjah Shake', 'Avil Milk', 'Fresh Lime', 'Mint Lime', 'Cold Coffee'],
        'Italian': ['Alfredo Pasta', 'Arrabbiata Pasta', 'Lasagna', 'Garlic Bread', 'Mushroom Risotto'],
        'South Indian': ['Mini Tiffin', 'Ghee Roast', 'Idli Sambar', 'Poori Masala', 'Set Dosa'],
        'North Indian': ['Butter Chicken', 'Kadai Chicken', 'Paneer Tikka Masala', 'Jeera Rice', 'Butter Naan Combo'],
    }

    CATEGORY_TO_CUISINES = {
        'Best Sellers': ['Biryani', 'Seafood', 'Shawaya', 'Burger', 'Chinese'],
        'Meals': ['Breakfast', 'Seafood', 'Veg Specials', 'South Indian'],
        'Biryanis': ['Biryani'],
        'Seafood': ['Seafood'],
        'Snacks': ['Tea & Snacks'],
        'Beverages': ['Juices'],
        'Desserts': ['Desserts'],
        'Combos': ['Biryani', 'Chinese', 'Mandhi', 'Burger'],
        'Mandhi': ['Mandhi'],
        'Alfaham': ['Shawaya'],
        'Shawarma': ['Shawaya', 'Burger'],
        'Platters': ['Mandhi', 'Shawaya', 'Chinese'],
        'Breakfast': ['Breakfast', 'South Indian'],
        'Coffee': ['Tea & Snacks', 'Desserts'],
        'Quick Bites': ['Burger', 'Tea & Snacks', 'Chinese'],
        'Sandwiches': ['Burger'],
        'Pasta & Pizza': ['Italian', 'Pizza'],
        'Shakes': ['Juices', 'Desserts'],
        'Grill': ['Shawaya'],
        'BBQ': ['Shawaya'],
        'Burger & Sandwich': ['Burger'],
        'Rice & Noodles': ['Chinese', 'Biryani'],
        'Family Meals': ['Mandhi', 'Biryani', 'Chinese'],
        'South Indian': ['South Indian', 'Breakfast'],
        'North Indian': ['North Indian'],
        'Curries': ['North Indian', 'Veg Specials', 'Seafood'],
        'Rice Bowls': ['Biryani', 'Chinese'],
        'Juices': ['Juices'],
        'Family Packs': ['Biryani', 'Mandhi', 'Veg Specials'],
    }

    CUSTOMER_DATA = [
        ('Amina Joseph', 'customer_amina@savor.com', '9847001001', 'Kochi'),
        ('Nikhil Das', 'customer_nikhil@savor.com', '9847001002', 'Kozhikode'),
        ('Riya Mathew', 'customer_riya@savor.com', '9847001003', 'Kannur'),
        ('Farhan Ali', 'customer_farhan@savor.com', '9847001004', 'Kochi'),
        ('Sana Fathima', 'customer_sana@savor.com', '9847001005', 'Kozhikode'),
        ('Arjun Menon', 'customer_arjun@savor.com', '9847001006', 'Kannur'),
    ]

    DELIVERY_DATA = [
        ('Kochi Rider 1', 'rider_kochi_1@savor.com', '9847101001', 'Kochi', True),
        ('Kochi Rider 2', 'rider_kochi_2@savor.com', '9847101002', 'Kochi', True),
        ('Kozhikode Rider 1', 'rider_kozhikode_1@savor.com', '9847101003', 'Kozhikode', True),
        ('Kozhikode Rider 2', 'rider_kozhikode_2@savor.com', '9847101004', 'Kozhikode', True),
        ('Kannur Rider 1', 'rider_kannur_1@savor.com', '9847101005', 'Kannur', True),
        ('Kannur Rider 2', 'rider_kannur_2@savor.com', '9847101006', 'Kannur', False),
    ]

    def handle(self, *args, **options):
        random.seed(42)
        mode = 'LOCAL IMAGES' if USE_LOCAL_IMAGES else 'REMOTE IMAGE URLS'
        self.stdout.write(self.style.WARNING(f'Starting Kerala workflow seed ({mode})'))

        with transaction.atomic():
            self.clear_existing_data()
            self.cuisines = self.create_cuisines()
            self.admin = self.create_admin()
            self.customers = self.create_customers()
            self.delivery_agents = self.create_delivery_agents()
            self.restaurants = self.create_restaurants()
            self.create_sample_carts()
            self.sample_orders = self.create_sample_orders()

        self.stdout.write(self.style.SUCCESS('Kerala workflow seed completed successfully.'))
        self.stdout.write(self.style.WARNING(f'Default password for all seeded users: {DEFAULT_PASSWORD}'))
        self.stdout.write(self.style.WARNING(f'Restaurant owners seeded: {len(self.restaurants)}'))
        self.stdout.write(self.style.WARNING(f'Delivery agents seeded: {len(self.delivery_agents)}'))
        self.stdout.write(self.style.WARNING(f'Customers seeded: {len(self.customers)}'))
        self.stdout.write(self.style.WARNING(f'Sample orders seeded: {len(self.sample_orders)}'))

    def clear_existing_data(self):
        self.stdout.write('Clearing existing demo data...')
        Payment.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        CartItem.objects.all().delete()
        Cart.objects.all().delete()
        MenuItem.objects.all().delete()
        Category.objects.all().delete()
        Cuisine.objects.all().delete()
        Restaurant.objects.all().delete()
        User.objects.filter(email__endswith='@savor.com').delete()

    def create_user(self, *, email, username, role, phone='', is_staff=False, is_superuser=False, is_available=False):
        user = User.objects.create(
            email=email,
            username=username,
            phone=phone,
            role=role,
            is_staff=is_staff,
            is_superuser=is_superuser,
            is_active=True,
            is_available=is_available,
        )
        user.set_password(DEFAULT_PASSWORD)
        user.save()
        return user

    def create_admin(self):
        self.stdout.write('Creating admin account...')
        return self.create_user(
            email='admin@savor.com',
            username='savor_admin',
            role=User.Role.ADMIN,
            phone='9990000001',
            is_staff=True,
            is_superuser=True,
        )

    def create_customers(self):
        self.stdout.write('Creating customer accounts...')
        customers = []
        for full_name, email, phone, city in self.CUSTOMER_DATA:
            username = slugify(full_name).replace('-', '_')
            customer = self.create_user(
                email=email,
                username=username,
                role=User.Role.CUSTOMER,
                phone=phone,
            )
            customer.first_name = full_name.split()[0]
            customer.last_name = full_name.split()[-1]
            customer.save(update_fields=['first_name', 'last_name'])
            customers.append({'user': customer, 'city': city})
        return customers

    def create_delivery_agents(self):
        self.stdout.write('Creating delivery agent accounts...')
        agents = []
        for full_name, email, phone, city, is_available in self.DELIVERY_DATA:
            username = slugify(full_name).replace('-', '_')
            agent = self.create_user(
                email=email,
                username=username,
                role=User.Role.DELIVERY,
                phone=phone,
                is_available=is_available,
            )
            agent.first_name = full_name.split()[0]
            agent.last_name = full_name.split()[-1]
            agent.save(update_fields=['first_name', 'last_name'])
            agents.append({'user': agent, 'city': city})
        return agents

    def create_cuisines(self):
        self.stdout.write('Creating global cuisines...')
        cuisines = {}
        for name, (filename, image_url) in self.CUISINE_DATA.items():
            cuisine = Cuisine.objects.create(name=name)
            apply_image(cuisine, 'image', get_image_source('cuisines', filename, image_url))
            cuisines[name] = cuisine
        return cuisines

    def create_restaurants(self):
        self.stdout.write('Creating restaurants, categories, and menu items...')
        restaurants = []
        sequence = 1
        for city, entries in self.RESTAURANT_BLUEPRINTS.items():
            for index, (name, cuisine_label, logo_name, logo_url) in enumerate(entries):
                owner_slug = slugify(f'{name}-{city}')
                owner = self.create_user(
                    email=f'{owner_slug}@savor.com',
                    username=f'restaurant_{owner_slug}',
                    role=User.Role.RESTAURANT,
                    phone=f'98950{sequence:05d}',
                )
                restaurant = Restaurant.objects.create(
                    owner=owner,
                    name=name,
                    cuisine=cuisine_label,
                    address=self.CITY_ADDRESSES[city][index],
                    phone=f'0484{sequence:06d}' if city == 'Kochi' else f'0495{sequence:06d}',
                    is_active=True,
                )
                apply_image(restaurant, 'logo', get_image_source('restaurants', logo_name, logo_url))
                categories = self.create_categories_for_restaurant(restaurant, cuisine_label)
                menu_items = self.create_menu_for_restaurant(restaurant, city, categories)
                restaurants.append(
                    {
                        'city': city,
                        'owner': owner,
                        'restaurant': restaurant,
                        'categories': categories,
                        'menu_items': menu_items,
                    }
                )
                sequence += 1
        return restaurants

    def create_categories_for_restaurant(self, restaurant, cuisine_label):
        category_set = self.get_category_set(cuisine_label)
        created = []
        for category_name in self.CATEGORY_SETS[category_set]:
            created.append(Category.objects.create(restaurant=restaurant, name=category_name))
        return created

    def create_menu_for_restaurant(self, restaurant, city, categories):
        menu_items = []
        for category in categories:
            allowed_cuisines = self.CATEGORY_TO_CUISINES.get(category.name, ['Biryani', 'Burger'])
            for item_index in range(12):
                cuisine_name = allowed_cuisines[item_index % len(allowed_cuisines)]
                cuisine = self.cuisines[cuisine_name]
                base_name = self.DISHES_BY_CUISINE[cuisine_name][item_index % len(self.DISHES_BY_CUISINE[cuisine_name])]
                suffix = self.get_item_suffix(category.name, item_index)
                item_name = f'{base_name} {suffix}'.strip()
                price = Decimal(str(self.get_price(cuisine_name, item_index)))
                menu_item = MenuItem.objects.create(
                    restaurant=restaurant,
                    category=category,
                    cuisine=cuisine,
                    name=item_name,
                    description=f'{item_name} from {restaurant.name}, prepared fresh for customers in {city}.',
                    price=price,
                    is_available=item_index % 11 != 0,
                    is_recommended=item_index % 4 == 0,
                    is_popular=item_index % 3 == 0,
                )
                _, cuisine_url = self.CUISINE_DATA[cuisine_name]
                menu_item.image = f'{cuisine_url}?q=60&w=600&auto=format&fit=crop'
                menu_item.save(update_fields=['image'])
                menu_items.append(menu_item)

        extra_categories = categories[:4]
        for extra_index, category in enumerate(extra_categories):
            cuisine_name = self.CATEGORY_TO_CUISINES.get(category.name, ['Biryani'])[0]
            cuisine = self.cuisines[cuisine_name]
            base_name = self.DISHES_BY_CUISINE[cuisine_name][extra_index % len(self.DISHES_BY_CUISINE[cuisine_name])]
            item_name = f'{base_name} Featured'
            menu_item = MenuItem.objects.create(
                restaurant=restaurant,
                category=category,
                cuisine=cuisine,
                name=item_name,
                description=f'{item_name} from {restaurant.name}, featured for the Kerala demo workflow.',
                price=Decimal(str(self.get_price(cuisine_name, extra_index + 5))),
                is_available=True,
                is_recommended=True,
                is_popular=True,
            )
            _, cuisine_url = self.CUISINE_DATA[cuisine_name]
            menu_item.image = f'{cuisine_url}?q=60&w=600&auto=format&fit=crop'
            menu_item.save(update_fields=['image'])
            menu_items.append(menu_item)

        return menu_items

    def create_sample_carts(self):
        self.stdout.write('Creating a few customer carts...')
        for index, customer_entry in enumerate(self.customers[:3]):
            customer = customer_entry['user']
            restaurant_bundle = next(bundle for bundle in self.restaurants if bundle['city'] == customer_entry['city'])
            cart = Cart.objects.create(user=customer)
            for item in restaurant_bundle['menu_items'][index:index + 2]:
                CartItem.objects.create(cart=cart, menu_item=item, quantity=index + 1)

    def create_sample_orders(self):
        self.stdout.write('Creating realistic sample orders...')
        now = timezone.now()
        samples = [
            {
                'city': 'Kochi',
                'customer_index': 0,
                'status': Order.Status.PENDING,
                'delivery_status': None,
                'payment_method': Payment.Method.COD,
                'payment_status': Payment.Status.PENDING,
                'items': [(0, 1), (1, 2)],
            },
            {
                'city': 'Kozhikode',
                'customer_index': 1,
                'status': Order.Status.PREPARING,
                'delivery_status': None,
                'payment_method': Payment.Method.RAZORPAY,
                'payment_status': Payment.Status.SUCCESS,
                'items': [(2, 1), (3, 1)],
            },
            {
                'city': 'Kannur',
                'customer_index': 2,
                'status': Order.Status.PREPARING,
                'delivery_status': Order.DeliveryStatus.ASSIGNED,
                'payment_method': Payment.Method.COD,
                'payment_status': Payment.Status.PENDING,
                'delivery_agent_city': 'Kannur',
                'delivery_agent_offset': 0,
                'items': [(4, 2), (5, 1)],
            },
            {
                'city': 'Kochi',
                'customer_index': 3,
                'status': Order.Status.PREPARING,
                'delivery_status': Order.DeliveryStatus.ACCEPTED,
                'payment_method': Payment.Method.RAZORPAY,
                'payment_status': Payment.Status.SUCCESS,
                'delivery_agent_city': 'Kochi',
                'delivery_agent_offset': 0,
                'accepted_minutes_ago': 18,
                'items': [(6, 1), (7, 1)],
            },
            {
                'city': 'Kozhikode',
                'customer_index': 4,
                'status': Order.Status.OUT_FOR_DELIVERY,
                'delivery_status': Order.DeliveryStatus.PICKED,
                'payment_method': Payment.Method.COD,
                'payment_status': Payment.Status.PENDING,
                'delivery_agent_city': 'Kozhikode',
                'delivery_agent_offset': 0,
                'accepted_minutes_ago': 25,
                'items': [(8, 1), (9, 1)],
            },
            {
                'city': 'Kannur',
                'customer_index': 5,
                'status': Order.Status.OUT_FOR_DELIVERY,
                'delivery_status': Order.DeliveryStatus.DELIVERING,
                'payment_method': Payment.Method.RAZORPAY,
                'payment_status': Payment.Status.SUCCESS,
                'delivery_agent_city': 'Kannur',
                'delivery_agent_offset': 0,
                'accepted_minutes_ago': 30,
                'delivery_lat': 11.8745,
                'delivery_lng': 75.3704,
                'items': [(10, 1), (11, 2)],
            },
            {
                'city': 'Kochi',
                'customer_index': 0,
                'status': Order.Status.DELIVERED,
                'delivery_status': Order.DeliveryStatus.DELIVERED,
                'payment_method': Payment.Method.COD,
                'payment_status': Payment.Status.SUCCESS,
                'delivery_agent_city': 'Kochi',
                'delivery_agent_offset': 1,
                'accepted_minutes_ago': 65,
                'delivery_lat': 9.9816,
                'delivery_lng': 76.2999,
                'items': [(12, 1), (13, 1)],
            },
            {
                'city': 'Kozhikode',
                'customer_index': 1,
                'status': Order.Status.CANCELLED,
                'delivery_status': None,
                'payment_method': Payment.Method.RAZORPAY,
                'payment_status': Payment.Status.FAILED,
                'items': [(14, 1)],
            },
        ]

        created_orders = []
        for index, config in enumerate(samples):
            restaurant_bundle = self.get_restaurant_bundle(config['city'], index)
            customer = self.customers[config['customer_index']]['user']
            items = [
                (restaurant_bundle['menu_items'][item_index], quantity)
                for item_index, quantity in config['items']
            ]
            total = sum(menu_item.price * quantity for menu_item, quantity in items)
            order = Order.objects.create(
                user=customer,
                restaurant=restaurant_bundle['restaurant'],
                delivery_agent=self.get_delivery_agent(config),
                status=config['status'],
                delivery_status=config['delivery_status'],
                delivery_lat=config.get('delivery_lat'),
                delivery_lng=config.get('delivery_lng'),
                total_amount=total,
                address=customer.username.replace('_', ' ').title() + f', {config["city"]}, Kerala',
                accepted_at=self.build_accepted_at(config, now),
            )

            for menu_item, quantity in items:
                OrderItem.objects.create(
                    order=order,
                    menu_item=menu_item,
                    quantity=quantity,
                    price=menu_item.price,
                )

            Payment.objects.create(
                order=order,
                method=config['payment_method'],
                status=config['payment_status'],
                razorpay_order_id=f'razorpay_demo_{order.id}' if config['payment_method'] == Payment.Method.RAZORPAY else None,
            )
            created_orders.append(order)

        delivered_agents = {
            order.delivery_agent_id
            for order in created_orders
            if order.delivery_status == Order.DeliveryStatus.DELIVERED and order.delivery_agent_id
        }
        if delivered_agents:
            User.objects.filter(id__in=delivered_agents).update(earnings=Decimal('50.00'))

        return created_orders

    def get_delivery_agent(self, config):
        city = config.get('delivery_agent_city')
        if not city:
            return None
        candidates = [entry['user'] for entry in self.delivery_agents if entry['city'] == city]
        return candidates[config.get('delivery_agent_offset', 0) % len(candidates)]

    def build_accepted_at(self, config, now):
        minutes = config.get('accepted_minutes_ago')
        if not minutes:
            return None
        return now - timedelta(minutes=minutes)

    def get_restaurant_bundle(self, city, offset):
        bundles = [bundle for bundle in self.restaurants if bundle['city'] == city]
        return bundles[offset % len(bundles)]

    def get_category_set(self, cuisine_label):
        lowered = cuisine_label.lower()
        if any(keyword in lowered for keyword in ['mandhi', 'arabian', 'alfaham']):
            return 'arabian'
        if any(keyword in lowered for keyword in ['cafe', 'bakery', 'european']):
            return 'cafe'
        if any(keyword in lowered for keyword in ['grill', 'bbq', 'steak']):
            return 'grill'
        if any(keyword in lowered for keyword in ['veg', 'puttu', 'south indian']):
            return 'veg'
        return 'kerala'

    def get_item_suffix(self, category_name, item_index):
        suffixes = {
            'Best Sellers': ['House Special', 'Top Pick', 'Signature'],
            'Meals': ['Lunch Plate', 'Dinner Plate', 'Combo'],
            'Biryanis': ['Dum Style', 'Festival Pack', 'Premium'],
            'Mandhi': ['Family Bowl', 'Chef Style', 'Special'],
            'Desserts': ['Classic', 'Cold', 'Delight'],
        }
        options = suffixes.get(category_name, ['Special', 'Signature', 'Classic'])
        return options[item_index % len(options)]

    def get_price(self, cuisine_name, item_index):
        base_prices = {
            'Biryani': 220,
            'Burger': 180,
            'Pizza': 260,
            'Mandhi': 320,
            'Seafood': 280,
            'Tea & Snacks': 60,
            'Desserts': 120,
            'Chinese': 190,
            'Shawaya': 240,
            'Breakfast': 90,
            'Veg Specials': 150,
            'Juices': 80,
            'Italian': 230,
            'South Indian': 110,
            'North Indian': 210,
        }
        return base_prices[cuisine_name] + (item_index % 5) * 20
