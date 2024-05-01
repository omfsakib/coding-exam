from datetime import datetime

from django.views import generic
from django.core.paginator import Paginator

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from product.models import Variant, Product, ProductVariant, ProductVariantPrice
from product.serializers import ProductSerializer, ProductVariantSerializer, ProductVariantPriceSerializer


class CreateProductView(generic.TemplateView):
    template_name = 'products/create.html'

    def get_context_data(self, **kwargs):
        context = super(CreateProductView, self).get_context_data(**kwargs)
        variants = Variant.objects.filter(active=True).values('id', 'title')
        context['product'] = True
        context['variants'] = list(variants.all())
        return context


class EditProductView(generic.TemplateView):
    template_name = 'products/edit.html'

    def get_context_data(self, **kwargs):
        context = super(EditProductView, self).get_context_data(**kwargs)
        pk = kwargs.get('pk')
        product = Product.objects.get(pk=pk)
        variants = Variant.objects.filter(active=True).values('id', 'title')
        context['product'] = ProductSerializer(product).data
        context['variants'] = list(variants.all())
        return context


class ListProductView(generic.TemplateView):
    template_name = 'products/list.html'
    paginate_by = 2

    def get_queryset(self):
        return Product.objects.all()

    def filter_by_title(self, queryset, title):
        if title:
            return queryset.filter(title__icontains=title)
        return queryset

    def filter_by_variant(self, queryset, variant):
        if variant:
            product_ids = ProductVariant.objects.filter(variant_title=variant).values_list('product_id', flat=True)
            return queryset.filter(id__in=product_ids)
        return queryset

    def filter_by_price_range(self, queryset, price_from, price_to):
        if price_from and price_to:
            product_ids = ProductVariantPrice.objects.filter(price__gte=price_from, price__lte=price_to).values_list(
                'product_id', flat=True)
            return queryset.filter(id__in=product_ids)
        return queryset

    def filter_by_created_date(self, queryset, date):
        if date:
            parsed_date = datetime.strptime(date, '%Y-%m-%d')
            return queryset.filter(created_at__date=parsed_date)
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        queryset = self.get_queryset()

        title = self.request.GET.get('title')
        queryset = self.filter_by_title(queryset, title)

        variant = self.request.GET.get('variant')
        queryset = self.filter_by_variant(queryset, variant)

        price_from = self.request.GET.get('price_from')
        price_to = self.request.GET.get('price_to')
        queryset = self.filter_by_price_range(queryset, price_from, price_to)

        date = self.request.GET.get('date')
        queryset = self.filter_by_created_date(queryset, date)

        paginator = Paginator(queryset, self.paginate_by)
        page_number = self.request.GET.get('page')
        page_obj = paginator.get_page(page_number)

        context['products'] = page_obj
        context['variants'] = self.get_grouped_variants()
        return context

    def get_grouped_variants(self):
        variants = Variant.objects.filter(active=True).values('id', 'title')
        product_variants = ProductVariant.objects.all().values('id', 'variant_title', 'variant')
        grouped_variants = {}
        for variant in variants:
            grouped_variants[variant['title']] = list(
                {pv['variant_title']: pv for pv in product_variants if pv['variant'] == variant['id']}.values())
        return grouped_variants


class ProductAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            product_variants = request.data.get('product_variants')
            product_variant_prices = request.data.get('product_variant_price')
            for product_variant in product_variants:
                for tag in product_variant['tags']:
                    variant_item = {
                        'variant_title': tag,
                        'variant': product_variant['option'],
                        'product': product.id
                    }
                    variant_serializer = ProductVariantSerializer(data=variant_item)
                    if variant_serializer.is_valid():
                        variant_serializer.save()
                    else:
                        print((variant_serializer.errors))
            for product_variant_price in product_variant_prices:
                titles = [title.strip() for title in product_variant_price['title'].split('/') if title.strip()]
                variant_price_item = {
                    'product_variant_one': ProductVariant.objects.filter(variant_title=titles[0]).first().id,
                    'product_variant_two': ProductVariant.objects.filter(variant_title=titles[0]).first().id,
                    'product_variant_three': ProductVariant.objects.filter(variant_title=titles[0]).first().id,
                    'price': product_variant_price['price'],
                    'stock': product_variant_price['stock'],
                    'product': product.id
                }
                variant_price_serializer = ProductVariantPriceSerializer(data=variant_price_item)
                if variant_price_serializer.is_valid():
                    variant_price_serializer.save()
                else:
                    print(variant_price_serializer.errors)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

