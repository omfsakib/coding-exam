from rest_framework import serializers

from product.models import Product, ProductImage, ProductVariant, ProductVariantPrice


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'


class ProductVariantPriceSerializer(serializers.ModelSerializer):
    product_variant_one = ProductVariantSerializer(read_only=True)
    product_variant_two = ProductVariantSerializer(read_only=True)
    product_variant_three = ProductVariantSerializer(read_only=True)

    class Meta:
        model = ProductVariantPrice
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    product_images = ProductImageSerializer(many=True, read_only=True)
    product_variants = ProductVariantSerializer(many=True, read_only=True)
    product_variant_price = ProductVariantPriceSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

