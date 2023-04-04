import React, { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from "chart.js";
import { Line } from "react-chartjs-2";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import ToggleButton from "react-bootstrap/ToggleButton";
import Table from "react-bootstrap/Table";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import DerivAPIBasic from "https://cdn.skypack.dev/@deriv/deriv-api/dist/DerivAPIBasic";
import "./App.css";

function App() {
	// method for content configuration
	const layoutConfig = {
		contentLoader: true,
		contentSubmitter: true,
	};
	// method for chart configuration
	ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);
	const options = {
		responsive: false,
		maintainAspectRatio: false,
		elements: {
			line: {
				tension: 0.3,
			},
		},
		scales: {
			x: {
				display: false,
				grid: {
					display: false,
				},
				ticks: {
					display: false,
				},
			},
			y: {
				display: false,
				grid: {
					display: false,
				},
				ticks: {
					display: false,
				},
			},
		},
		plugins: {
			legend: {
				display: false,
			},
			title: {
				display: false,
			},
		},
	};
	const labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
	const data = {
		labels,
		datasets: [
			{
				fill: true,
				data: [23, 24, 23, 27, 24, 28, 21, 23, 22, 28, 23, 24, 23, 27, 24, 28, 22, 23, 22, 28, 25, 23, 22, 28],
				borderColor: "rgb(53, 162, 235)",
				backgroundColor: "rgba(53, 162, 235, 0.5)",
			},
		],
	};
	// method for establishing the connection with deriv api
	const app_id = 1089;
	const connection = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);
	const api = new DerivAPIBasic({ connection });
	// method for requesting the active symbols
	const active_symbols_request = { active_symbols: "brief", product_type: "basic" };
	const [assetName, setAssetName] = useState("forex");
	const [assets, setAssets] = useState([]);
	const [subCategory, setSubCategory] = useState("minor_pairs");
	const [subCategories, setSubcategories] = useState([]);
	const activeSymbolsResponse = async (res) => {
		const data = JSON.parse(res.data);
		if (data.error !== undefined) {
			console.log("Error : ", data.error?.message);
			connection.removeEventListener("message", activeSymbolsResponse, false);
			await api.disconnect();
			layoutConfig.contentLoader = false;
			layoutConfig.contentSubmitter = false;
		}
		if (data.msg_type === "active_symbols") {
			layoutConfig.contentLoader = false;
			layoutConfig.contentSubmitter = false;
			setAssets(data.active_symbols);
		}
		connection.removeEventListener("message", activeSymbolsResponse, false);
	};
	const getActiveSymbols = async () => {
		connection.addEventListener("message", activeSymbolsResponse);
		await api.activeSymbols(active_symbols_request);
	};
	const filterSubCategories = (value) => {
		const selectedValue = value;
		const filteredData = [...new Set(assets.filter((asset) => asset.market === selectedValue).map((asset) => asset.submarket))];
		let uniqueSubCategories = [];
		filteredData.map((name) => {
			uniqueSubCategories.push(
				assets.find((asset) => {
					if (asset.submarket === name) {
						return asset;
					}
				})
			);
		});
		setSubcategories(uniqueSubCategories);
	};
	const handleTabSelection = (value) => {
		filterSubCategories(value);
		switch (value) {
			case "forex":
				setSubCategory("minor_pairs");
				break;
			case "synthetic_index":
				setSubCategory("forex_basket");
				break;
			case "indices":
				setSubCategory("asia_oceania_OTC");
				break;
			case "cryptocurrency":
				setSubCategory("non_stable_coin");
				break;
			case "commodities":
				setSubCategory("metals");
				break;
		}
	};
	useEffect(() => {
		filterSubCategories(assetName);
		getActiveSymbols();
	}, [assets]);
	return (
		<div className="app">
			<Container>
				<Row>
					<Col>
						<div className="custom-card">
							<div className="custom-card-body">
								{assets.length ? (
									<Tabs
										activeKey={assetName}
										onSelect={(a) => {
											setAssetName(a);
											handleTabSelection(a);
										}}
										variant="pills"
										fill
										className="mb-3">
										<Tab eventKey="forex" title="Forex">
											<ButtonToolbar className="my-3">
												{subCategories.map((category, idx) => (
													<ButtonGroup key={idx} className="me-2">
														<ToggleButton
															key={idx}
															type="radio"
															id={`radio-${category.submarket}-forex`}
															name="radio-forex"
															size="sm"
															variant="outline-secondary"
															className="rounded-pill"
															value={category.submarket}
															checked={category.submarket === subCategory}
															onChange={(e) => {
																setSubCategory(e.currentTarget.value);
															}}>
															{category.submarket_display_name}
														</ToggleButton>
													</ButtonGroup>
												))}
											</ButtonToolbar>
											<Table size="lg" hover className="align-middle mb-0">
												<thead>
													<tr>
														<th>Name</th>
														<th>Last Price</th>
														<th>24h Change</th>
														<th></th>
														<th></th>
													</tr>
												</thead>
												<tbody>
													{assets
														.filter((asset) => asset.market === assetName && asset.submarket === subCategory)
														.map((asset, index) => (
															<tr key={index}>
																<td>{asset.display_name}</td>
																<td>{asset.pip}</td>
																<td>{asset.pip}</td>
																<td>
																	<Line style={{ width: "150px", height: "75px" }} options={options} data={data} />
																</td>
																<td>
																	<Button variant="outline-dark">Trade</Button>
																</td>
															</tr>
														))}
												</tbody>
											</Table>
										</Tab>
										<Tab eventKey="synthetic_index" title="Synthetic Indices">
											<ButtonToolbar className="my-3">
												{subCategories.map((category, idx) => (
													<ButtonGroup key={idx} className="me-2">
														<ToggleButton
															key={idx}
															type="radio"
															id={`radio-${category.submarket}-synthetic-index`}
															name="radio-synthetic-index"
															size="sm"
															variant="outline-secondary"
															className="rounded-pill"
															value={category.submarket}
															checked={category.submarket === subCategory}
															onChange={(e) => {
																setSubCategory(e.currentTarget.value);
															}}>
															{category.submarket_display_name}
														</ToggleButton>
													</ButtonGroup>
												))}
											</ButtonToolbar>
											<Table size="lg" hover className="align-middle mb-0">
												<thead>
													<tr>
														<th>Name</th>
														<th>Last Price</th>
														<th>24h Change</th>
														<th></th>
														<th></th>
													</tr>
												</thead>
												<tbody>
													{assets
														.filter((asset) => asset.market === assetName && asset.submarket === subCategory)
														.map((asset, index) => (
															<tr key={index}>
																<td>{asset.display_name}</td>
																<td>{asset.pip}</td>
																<td>{asset.pip}</td>
																<td><Line style={{ width: "150px", height: "75px" }} options={options} data={data} /></td>
																<td>
																	<Button variant="outline-dark">Trade</Button>
																</td>
															</tr>
														))}
												</tbody>
											</Table>
										</Tab>
										<Tab eventKey="indices" title="Stock Indices">
											<ButtonToolbar className="my-3">
												{subCategories.map((category, idx) => (
													<ButtonGroup key={idx} className="me-2">
														<ToggleButton
															key={idx}
															type="radio"
															id={`radio-${category.submarket}-indices`}
															name="radio-indices"
															size="sm"
															variant="outline-secondary"
															className="rounded-pill"
															value={category.submarket}
															checked={category.submarket === subCategory}
															onChange={(e) => {
																setSubCategory(e.currentTarget.value);
															}}>
															{category.submarket_display_name}
														</ToggleButton>
													</ButtonGroup>
												))}
											</ButtonToolbar>
											<Table size="lg" hover className="align-middle mb-0">
												<thead>
													<tr>
														<th>Name</th>
														<th>Last Price</th>
														<th>24h Change</th>
														<th></th>
														<th></th>
													</tr>
												</thead>
												<tbody>
													{assets
														.filter((asset) => asset.market === assetName && asset.submarket === subCategory)
														.map((asset, index) => (
															<tr key={index}>
																<td>{asset.display_name}</td>
																<td>{asset.pip}</td>
																<td>{asset.pip}</td>
																<td><Line style={{ width: "150px", height: "75px" }} options={options} data={data} /></td>
																<td>
																	<Button variant="outline-dark">Trade</Button>
																</td>
															</tr>
														))}
												</tbody>
											</Table>
										</Tab>
										<Tab eventKey="cryptocurrency" title="Cryptocurrencies">
											<ButtonToolbar className="my-3">
												{subCategories.map((category, idx) => (
													<ButtonGroup key={idx} className="me-2">
														<ToggleButton
															key={idx}
															type="radio"
															id={`radio-${category.submarket}-cryptocurrency`}
															name="radio-cryptocurrency"
															size="sm"
															variant="outline-secondary"
															className="rounded-pill"
															value={category.submarket}
															checked={category.submarket === subCategory}
															onChange={(e) => {
																setSubCategory(e.currentTarget.value);
															}}>
															{category.submarket_display_name}
														</ToggleButton>
													</ButtonGroup>
												))}
											</ButtonToolbar>
											<Table size="lg" hover className="align-middle mb-0">
												<thead>
													<tr>
														<th>Name</th>
														<th>Last Price</th>
														<th>24h Change</th>
														<th></th>
														<th></th>
													</tr>
												</thead>
												<tbody>
													{assets
														.filter((asset) => asset.market === assetName && asset.submarket === subCategory)
														.map((asset, index) => (
															<tr key={index}>
																<td>{asset.display_name}</td>
																<td>{asset.pip}</td>
																<td>{asset.pip}</td>
																<td><Line style={{ width: "150px", height: "75px" }} options={options} data={data} /></td>
																<td>
																	<Button variant="outline-dark">Trade</Button>
																</td>
															</tr>
														))}
												</tbody>
											</Table>
										</Tab>
										<Tab eventKey="commodities" title="Commodities">
											<ButtonToolbar className="my-3">
												{subCategories.map((category, idx) => (
													<ButtonGroup key={idx} className="me-2">
														<ToggleButton
															key={idx}
															type="radio"
															id={`radio-${category.submarket}-commodities`}
															name="radio-commodities"
															size="sm"
															variant="outline-secondary"
															className="rounded-pill"
															value={category.submarket}
															checked={category.submarket === subCategory}
															onChange={(e) => {
																setSubCategory(e.currentTarget.value);
															}}>
															{category.submarket_display_name}
														</ToggleButton>
													</ButtonGroup>
												))}
											</ButtonToolbar>
											<Table size="lg" hover className="align-middle mb-0">
												<thead>
													<tr>
														<th>Name</th>
														<th>Last Price</th>
														<th>24h Change</th>
														<th></th>
														<th></th>
													</tr>
												</thead>
												<tbody>
													{assets
														.filter((asset) => asset.market === assetName && asset.submarket === subCategory)
														.map((asset, index) => (
															<tr key={index}>
																<td>{asset.display_name}</td>
																<td>{asset.pip}</td>
																<td>{asset.pip}</td>
																<td><Line style={{ width: "150px", height: "75px" }} options={options} data={data} /></td>
																<td>
																	<Button variant="outline-dark">Trade</Button>
																</td>
															</tr>
														))}
												</tbody>
											</Table>
										</Tab>
									</Tabs>
								) : (
									<p className="placeholder-glow mb-0">
										<span className="placeholder col-12"></span>
									</p>
								)}
							</div>
						</div>
					</Col>
				</Row>
			</Container>
		</div>
	);
}

export default App;
