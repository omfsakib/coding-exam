import itertools

from django.db import models
from django.db.models import Q
from config.g_model import TimeStampMixin


# Create your models here.
class Variant(TimeStampMixin):
    title = models.CharField(max_length=40, unique=True)
    description = models.TextField()
    active = models.BooleanField(default=True)


class Product(TimeStampMixin):
    title = models.CharField(max_length=255)
    sku = models.SlugField(max_length=255, unique=True)
    description = models.TextField()

    @property
    def combined_variants(self):
        product_variants = []
        grouped_variants = {}
        for variant in self.product_variants.all():
            if variant.variant_id not in grouped_variants:
                grouped_variants[variant.variant_id] = []
            grouped_variants[variant.variant_id].append(variant)

        # Create a list of lists containing all variants
        all_variants = list(grouped_variants.values())
        combinations = itertools.product(*all_variants)

        for combination in combinations:
            and_queries = []
            for perm in itertools.permutations(combination):
                perm_and_queries = []
                for i, variant in enumerate(perm, start=1):
                    field_name = f'product_variant_{["one", "two", "three"][i - 1]}'
                    and_query = Q(**{field_name: variant})
                    perm_and_queries.append(and_query)
                perm_and_query = Q()
                for and_query in perm_and_queries:
                    perm_and_query &= and_query
                and_queries.append(perm_and_query)
            or_query = Q()
            for and_query in and_queries:
                or_query |= and_query

            price_object = self.product_variant_price.filter(or_query).first()

            variant = {
                'attributes': list(combination),
                'details': price_object,
            }
            product_variants.append(variant)
        return product_variants


class ProductImage(TimeStampMixin):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    file_path = models.URLField()


class ProductVariant(TimeStampMixin):
    variant_title = models.CharField(max_length=255)
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name='variants')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_variants')


class ProductVariantPrice(TimeStampMixin):
    product_variant_one = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, null=True,
                                            related_name='product_variant_one')
    product_variant_two = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, null=True,
                                            related_name='product_variant_two')
    product_variant_three = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, null=True,
                                              related_name='product_variant_three')
    price = models.FloatField()
    stock = models.FloatField()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_variant_price')
