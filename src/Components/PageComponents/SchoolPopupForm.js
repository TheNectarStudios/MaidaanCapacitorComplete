import React, { useEffect } from "react";
import { Dialog, Autocomplete, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import AppInput from "../Common/AppInput";
import AppButton from "../Common/AppButton";
import { getAllTenants } from "../../services/tenant";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase-config";
import Lottie from "lottie-react";
import confettiAnimation from "../../assets/animations/confetti.json";
import mixpanel from "mixpanel-browser";

export const SchoolPopupForm = ({
	formData,
	setFormData,
	setShowSchoolPopup,
	showSchoolPopup,
}) => {
	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
	} = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			designation: "",
			school: "",
			city: "",
			phoneNumber: "",
		},
	});

	let tenantId = "";
	let isSchoolArray = false;

	const [isTenantSchoolSelected, setIsTenantSchoolSelected] =
		React.useState(false);

	const [showSuccessPopup, setShowSuccessPopup] = React.useState(false);

	const designationOptions = [
		{ label: "Director", value: "Director" },
		{ label: "Owner/Trustee", value: "OwnerTrustee" },
		{ label: "Principal", value: "Principal" },
		{ label: "Teacher", value: "Teacher" },
	];

	const [buttonLoading, setButtonLoading] = React.useState(false);

	const isMaidaanTenant = !tenantId;

	const [allTenants, setAllTenants] = React.useState([]);
	const [selectedMedium, setSelectedMedium] = React.useState("english");

	useEffect(() => {
		const fetchAllTenants = async () => {
			const data = await getAllTenants();
			setAllTenants(data);
		};
		fetchAllTenants();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const addSchoolFormData = async (finalData) => {
		const collectionRef = collection(db, "schoolLeads");
		finalData.createdAt = new Date();
		await addDoc(collectionRef, finalData);
	};

	const handleRegister = async (formData) => {
		for (const key in formData) {
			if (Object.hasOwnProperty.call(formData, key)) {
				// Trim the value associated with the current key
				formData[key] = formData[key].trim();
			}
		}
		const phoneNumber = formData.phoneNumber;
		formData.phoneNumber = `+91${phoneNumber}`;
		let source = "Open";
		let id = "NA";
		if (tenantId) {
			source = "School";
			id = tenantId;
		}
		mixpanel.identify(phoneNumber);
		mixpanel.track("Registration_Complete", {
			Source: source,
			SourceID: id,
		});

		let finalData = {
			...formData,
		};

		if (isTenantSchoolSelected) {
			finalData.tenantId = formData.school;
			const school = allTenants.find((tenant) => tenant.id === formData.school);
			finalData.school = school.name;
		}

		finalData.grade = 15;
		finalData.parentName = "faculty";
		finalData.mediumOfInstruction = selectedMedium;
		finalData.websiteSchoolLead = true;

		// Remove undefined values from finalData
		Object.keys(finalData).forEach(
			(key) => !finalData[key] && delete finalData[key]
		);
		try {
			await addSchoolFormData(finalData);
			setShowSchoolPopup(false);
		} catch (error) {
			// Handle error if needed
		} finally {
			setShowSuccessPopup(true);
		}
	};

	const renderSuccessDialog = () => {
		return (
			<Dialog
				open={showSuccessPopup}
				onClose={() => {
					setShowSchoolPopup(false);
					setShowSuccessPopup(false);
				}}
				className="register-success">
				<div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
					<img src="/Assets/Icons/tickmark.svg" alt="tickmark" />
					<span className="text-lg md:text-xl font-medium text-center">
						Thank You!
					</span>
					<span className="text-sm text-center">
						Our team will connect with you soon
					</span>
					<Lottie
						animationData={confettiAnimation}
						loop={false}
						className="absolute h-full w-full top-0 z-0"
					/>
				</div>
			</Dialog>
		);
	};

	if (showSuccessPopup) {
		return renderSuccessDialog();
	}

	if (showSchoolPopup) {
		return (
			<Dialog
				open={showSchoolPopup}
				onClose={() => setShowSchoolPopup(false)}
				className="register-success">
				<form onSubmit={handleSubmit(handleRegister)} className="">
					<div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-base">
						<div className="flex flex-col justify-around px-9 mb-4 h-full w-full max-w-lg gap-[10px] md:gap-[16px]">
							{/* First Name */}
							<Controller
								name="firstName"
								control={control}
								rules={{
									required: "First Name is required",
									maxLength: {
										value: 50,
										message: "Maximum 50 characters allowed",
									},
								}}
								render={({ field }) => (
									<AppInput
										{...field}
										wrapperClassName="items-start"
										className="text-center !text-base"
										showLabel
										label="First Name"
										maxLength={50}
										error={errors.firstName?.message}
									/>
								)}
							/>

							{/* Last Name */}
							<Controller
								name="lastName"
								control={control}
								rules={{
									required: "Last Name is required",
									maxLength: {
										value: 50,
										message: "Maximum 50 characters allowed",
									},
								}}
								render={({ field }) => (
									<AppInput
										{...field}
										wrapperClassName="items-start"
										className="text-center !text-base"
										showLabel
										label="Last Name"
										maxLength={50}
										error={errors.lastName?.message}
									/>
								)}
							/>

							{/* Designation */}
							<div>
								<span
									style={{
										display: "inline-block",
										transform: "skewX(-10deg)",
										color: "white",
										fontSize: "16px",
									}}>
									Designation
								</span>

								<Controller
									name="designation"
									control={control}
									rules={{
										required: "Designation is required",
									}}
									render={({ field }) => (
										<Autocomplete
											options={designationOptions}
											getOptionLabel={(option) => option.label}
											onChange={(event, value) => {
												field.onChange(value ? value.value : "");
											}}
											value={
												designationOptions.find(
													(option) => option.value === field.value
												) || null
											}
											openOnFocus
											// disablePortal
											renderInput={(params) => (
												<TextField
													{...params}
													placeholder="Designation"
													error={!!errors.designation}
													helperText={errors.designation?.message}
													variant="outlined"
													InputProps={{
														...params.InputProps,
														style: {
															color: "white",
															height: "42px",
															padding: 0,
														},
													}}
													InputLabelProps={{
														shrink: false,
														style: { color: "white" },
													}}
													FormHelperTextProps={{
														style: {
															color: "red",
															fontSize: "14px",
															fontFamily: "Avenir",
															margin: 0,
														},
													}}
													sx={{
														"& .MuiOutlinedInput-root": {
															"& fieldset": {
																borderColor: "white",
															},
															"&:hover fieldset": {
																borderColor: "white",
															},
															"&.Mui-focused fieldset": {
																borderColor: "white",
															},
														},
														"& .MuiSvgIcon-root": {
															color: "white",
														},
													}}
												/>
											)}
										/>
									)}
								/>
							</div>

							{/* School */}
							<Controller
								name="school"
								control={control}
								rules={{
									required: "School is required",
								}}
								render={({ field }) => (
									<AppInput
										{...field}
										wrapperClassName="items-start"
										className="text-center !text-base"
										showLabel
										label="School"
										maxLength={50}
										error={errors.school?.message}
										disabled={!isMaidaanTenant}
									/>
								)}
							/>

							{/* City */}
							<Controller
								name="city"
								control={control}
								rules={{
									required: "City/Region is required",
								}}
								render={({ field }) => (
									<AppInput
										{...field}
										wrapperClassName="items-start"
										className="text-center !text-base"
										showLabel
										label="City"
										maxLength={50}
										error={errors.city?.message}
										disabled={!isMaidaanTenant}
									/>
								)}
							/>

							{/* Phone Number */}
							<Controller
								name="phoneNumber"
								control={control}
								rules={{
									required: "Phone Number is required",
								}}
								render={({ field }) => (
									<AppInput
										{...field}
										wrapperClassName="items-start"
										className="text-center !text-base"
										showLabel
										label="Phone Number"
										maxLength={50}
										error={errors.phoneNumber?.message}
										disabled={!isMaidaanTenant}
									/>
								)}
							/>

							{/* Medium of Instruction */}
							<div className="flex flex-col gap-1 text-base">
								<span className="text-start">Medium of Instruction</span>
								<div className="flex gap-4">
									<label>
										<input
											type="radio"
											name="language"
											value="english"
											checked={selectedMedium === "english"}
											onChange={() => setSelectedMedium("english")}
											style={{ accentColor: "#ccf900" }}
										/>
										English
									</label>
									<label>
										<input
											type="radio"
											name="language"
											value="other"
											checked={selectedMedium === "other"}
											onChange={() => setSelectedMedium("other")}
											style={{ accentColor: "#ccf900" }}
										/>
										Other
									</label>
								</div>
							</div>
						</div>

						{/* Submit Button */}
						<div className="flex items-center justify-center">
							<AppButton isLoading={buttonLoading}>Submit</AppButton>
						</div>
					</div>
				</form>
			</Dialog>
		);
	}

	return null;
};
