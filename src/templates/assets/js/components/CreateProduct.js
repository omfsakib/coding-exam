import React, {useState, useEffect} from 'react';
import TagsInput from 'react-tagsinput';
import 'react-tagsinput/react-tagsinput.css';
import Dropzone from 'react-dropzone'
import axios from 'axios';

const CreateProduct = (props) => {
    const [productImages, setProductImages] = useState([]);
    const [productVariantPrices, setProductVariantPrices] = useState([])

    const [productVariants, setProductVariant] = useState([
        {
            option: 1,
            tags: []
        }
    ])

    useEffect(() => {
        if (props.product !== undefined) {
            // Group product variants by variant option
            const groupedVariants = product.product_variants.reduce((acc, variant) => {
                acc[variant.variant] = acc[variant.variant] || [];
                acc[variant.variant].push({
                    id: variant.id,
                    variant_title: variant.variant_title
                });
                return acc;
            }, {});
            const filteredVariants = Object.keys(groupedVariants).map(option => ({
                option: parseInt(option),
                tags: groupedVariants[option].map(variant => variant.variant_title),
                ids: groupedVariants[option].map(variant => variant.id)
            }));
            setProductVariant(filteredVariants);
            product.product_variant_price.map((item) => {
                setProductVariantPrices(productVariantPrice => [...productVariantPrice, {
                    title: `${item.product_variant_one.variant_title}/${item.product_variant_two.variant_title}/${item.product_variant_three.variant_title}`,
                    price: item.price,
                    stock: item.stock
                }])
            })

        }
    }, [props.product]);

    const initialProductValues = {
        id: props.product !== undefined ? product.id : '',
        title: props.product !== undefined ? product.title : '',
        sku: props.product !== undefined ? product.sku : '',
        description: props.product !== undefined ? product.description : '',
    }

    const handleDrop = (acceptedFiles) => {
        // Update the productImages state with the accepted files
        setProductImages(acceptedFiles);
    };

    // handle click event of the Add button
    const handleAddClick = () => {
        let all_variants = JSON.parse(props.variants.replaceAll("'", '"')).map(el => el.id)
        let selected_variants = productVariants.map(el => el.option);
        let available_variants = all_variants.filter(entry1 => !selected_variants.some(entry2 => entry1 == entry2))
        console.log(available_variants[0])
        setProductVariant([...productVariants, {
            option: available_variants[0],
            tags: []
        }])
    };

    // handle input change on tag input
    const handleInputTagOnChange = (value, index) => {
        let product_variants = [...productVariants]
        product_variants[index].tags = value
        setProductVariant(product_variants)

        checkVariant()
    }

    // remove product variant
    const removeProductVariant = (index) => {
        let product_variants = [...productVariants]
        product_variants.splice(index, 1)
        setProductVariant(product_variants)
    }

    // check the variant and render all the combination
    const checkVariant = () => {
        let tags = [];

        productVariants.filter((item) => {
            tags.push(item.tags)
        })

        setProductVariantPrices([])

        getCombn(tags).forEach(item => {
            setProductVariantPrices(productVariantPrice => [...productVariantPrice, {
                title: item,
                price: 0,
                stock: 0
            }])
        })

    }

    const handlePriceChange = (event, index) => {
        const {value} = event.target;
        setProductVariantPrices(prevPrices => {
            const newPrices = [...prevPrices];
            newPrices[index].price = value; // Update price for the specified index
            return newPrices;
        });
    };

    const handleStockChange = (event, index) => {
        const {value} = event.target;
        setProductVariantPrices(prevPrices => {
            const newPrices = [...prevPrices];
            newPrices[index].stock = value; // Update stock for the specified index
            return newPrices;
        });
    };

    // combination algorithm
    function getCombn(arr, pre) {
        pre = pre || '';
        if (!arr.length) {
            return pre;
        }
        let ans = arr[0].reduce(function (ans, value) {
            return ans.concat(getCombn(arr.slice(1), pre + value + '/'));
        }, []);
        return ans;
    }

    axios.defaults.xsrfCookieName = 'csrftoken';
    axios.defaults.xsrfHeaderName = 'X-CSRFToken';

    // Save product
    const saveProduct = (event) => {
        event.preventDefault();
        // Gather data from form fields
        const productName = document.getElementById("product-name").value;
        const productSKU = document.getElementById("product-sku").value;
        const description = document.getElementById("product-description").value;

        const productData = {
            id: initialProductValues.id,
            title: productName,
            sku: productSKU,
            description: description,
            product_variants: productVariants,
            product_variant_price: productVariantPrices,
            product_images: productImages,
        };

        if (props.product === undefined) {
            axios.post('/product/create/api/', productData)
                .then(response => {
                    // Handle success
                    console.log('Product saved successfully:', response.data);

                })
                .catch(error => {
                    // Handle error
                    console.error('Error saving product:', error);
                });
        } else {
            axios.put(`/product/update/${productData.id}/api/`, productData)
                .then(response => {
                    // Handle success
                    console.log('Product saved successfully:', response.data);
                    // Redirect or perform other actions if needed
                })
                .catch(error => {
                    // Handle error
                    console.error('Error saving product:', error);
                });
        }
    }


    return (
        <div>
            <section>
                <div className="row">
                    <div className="col-md-6">
                        <div className="card shadow mb-4">
                            <div className="card-body">
                                <div className="form-group">
                                    <label htmlFor="product-name">Product Name</label>
                                    <input id='product-name' defaultValue={initialProductValues.title} type="text"
                                           placeholder="Product Name"
                                           className="form-control"/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="product-sku">Product SKU</label>
                                    <input id='product-sku' type="text" defaultValue={initialProductValues.sku}
                                           placeholder="Product Name"
                                           className="form-control"/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="product-description">Description</label>
                                    <textarea id="product-description" cols="30" rows="4"
                                              className="form-control"
                                              defaultValue={initialProductValues.description}></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="card shadow mb-4">
                            <div
                                className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                <h6 className="m-0 font-weight-bold text-primary">Media</h6>
                            </div>
                            <div className="card-body border">
                                <Dropzone onDrop={handleDrop}>
                                    {({getRootProps, getInputProps}) => (
                                        <section>
                                            <div {...getRootProps()}>
                                                <input {...getInputProps()} />
                                                <p>Drag 'n' drop some files here, or click to select files</p>
                                            </div>
                                        </section>
                                    )}
                                </Dropzone>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="card shadow mb-4">
                            <div
                                className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                <h6 className="m-0 font-weight-bold text-primary">Variants</h6>
                            </div>
                            <div className="card-body">

                                {
                                    productVariants.map((element, index) => {
                                        return (
                                            <div className="row" key={index}>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="">Option</label>
                                                        <select className="form-control" defaultValue={element.option}>
                                                            {
                                                                JSON.parse(props.variants.replaceAll("'", '"')).map((variant, index) => {
                                                                    return (<option key={index}
                                                                                    value={variant.id}>{variant.title}</option>)
                                                                })
                                                            }

                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="col-md-8">
                                                    <div className="form-group">
                                                        {
                                                            productVariants.length > 1
                                                                ? <label htmlFor="" className="float-right text-primary"
                                                                         style={{marginTop: "-30px"}}
                                                                         onClick={() => removeProductVariant(index)}>remove</label>
                                                                : ''
                                                        }

                                                        <section style={{marginTop: "30px"}}>
                                                            <TagsInput value={element.tags}
                                                                       style="margin-top:30px"
                                                                       onChange={(value) => handleInputTagOnChange(value, index)}/>
                                                        </section>

                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                }


                            </div>
                            <div className="card-footer">
                                {productVariants.length !== 3
                                    ? <button className="btn btn-primary" onClick={handleAddClick}>Add another
                                        option</button>
                                    : ''
                                }

                            </div>

                            <div className="card-header text-uppercase">Preview</div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                        <tr>
                                            <td>Variant</td>
                                            <td>Price</td>
                                            <td>Stock</td>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {productVariantPrices.map((productVariantPrice, index) => {
                                            return (
                                                <tr key={index}>
                                                    <td>{productVariantPrice.title}</td>
                                                    <td><input className="form-control" name="price" type="number"
                                                               value={productVariantPrice.price}
                                                               onChange={(event) => handlePriceChange(event, index)}/>
                                                    </td>
                                                    <td><input className="form-control" name="stock" type="number"
                                                               value={productVariantPrice.stock}
                                                               onChange={(event) => handleStockChange(event, index)}/>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="button" onClick={saveProduct} className="btn btn-lg btn-primary">Save</button>
                <button type="button" className="btn btn-secondary btn-lg">Cancel</button>
            </section>
        </div>
    );
};

export default CreateProduct;
