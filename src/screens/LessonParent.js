import React, { Fragment } from "react"
import { Alert, View } from "react-native"
import { strings } from "../i18n"
import {
	SHORT_API_DATE_FORMAT,
	GOOGLE_MAPS_QUERY,
	autoCompletePlacesStyle,
	MAIN_PADDING,
	API_DATE_FORMAT
} from "../consts"
import moment from "moment"
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete"
import AlertError from "../components/AlertError"
import { Dropdown } from "react-native-material-dropdown"
import { durationMulOptions } from "./consts"

export default class LessonParent extends AlertError {
	handlePlaceSelection = (name, data) => {
		const place = {
			description: data.description,
			google_id: data.place_id
		}
		this.setState({
			[name + "ListViewDisplayed"]: false,
			[name]: place
		})
		// if clicked on a meetup place and dropoff is empty, fill it up too
		if (
			name == "meetup" &&
			(!this.state.dropoff.hasOwnProperty("description") ||
				this.state.dropoff.description == "")
		) {
			this.setState({ dropoff: place }, () => {
				this.dropoffRef.setAddressText(place.description)
			})
		}
	}

	clearPlaces() {
		this["meetupRef"]._handleChangeText("")
		this["dropoffRef"]._handleChangeText("")
	}

	renderPlaces = () => {
		const places = ["meetup", "dropoff"]
		return places.map((name, index) => {
			return (
				<GooglePlacesAutocomplete
					textInputProps={{
						onChangeText: text => {
							if (text == "") {
								this.setState({ [name]: {} })
								this.renderHours()
							}
						}
					}}
					ref={instance => {
						this[name + "Ref"] = instance
					}}
					key={`autocomplete-${name}`}
					query={GOOGLE_MAPS_QUERY}
					placeholder={strings("teacher.new_lesson." + name)}
					minLength={2}
					autoFocus={false}
					returnKeyType={"default"}
					fetchDetails={false}
					currentLocation={false}
					currentLocationLabel={strings("current_location")}
					nearbyPlacesAPI="GooglePlacesSearch"
					listViewDisplayed={this.state[name + "ListViewDisplayed"]}
					styles={autoCompletePlacesStyle}
					onPress={(data, details = null) => {
						// 'details' is provided when fetchDetails = true
						this.handlePlaceSelection(name, data)
					}}
					getDefaultValue={() => this.state[name].description || ""}
				/>
			)
		})
	}

	deleteConfirm() {
		Alert.alert(strings("are_you_sure"), strings("are_you_sure_delete"), [
			{
				text: strings("cancel"),
				style: "cancel"
			},
			{
				text: strings("ok"),
				onPress: () => {
					this.delete()
				}
			}
		])
	}

	delete = async () => {
		const { lesson } = this.state
		if (!lesson) return
		const resp = await this.props.fetchService.fetch(
			`/appointments/${lesson.id}`,
			{
				method: "DELETE"
			}
		)
		if (resp) {
			Alert.alert(strings("teacher.notifications.appointments_deleted"))
			this.props.navigation.goBack()
		}
	}

	_showDateTimePicker = () => this.setState({ datePickerVisible: true })

	_hideDateTimePicker = () => this.setState({ datePickerVisible: false })

	_handleDatePicked = date => {
		this._hideDateTimePicker()
		this.setState({ date: moment(date).format(API_DATE_FORMAT) }, () => {
			this._getAvailableHours()
		})
	}

	_getAvailableHours() {}

	calculatePrice() {}

	_dropdownChange = (value, index, data) => {
		let newDuration = value * this.duration
		if (newDuration === 0) newDuration = this.state.duration
		this.setState(
			{
				duration_mul: value,
				duration: newDuration
			},
			() => {
				this._getAvailableHours()
				this.calculatePrice()
			}
		)
	}

	renderDuration = () => {
		let value = this.state.duration_mul
		const values = durationMulOptions.map(({ value }) => value)
		if (!values.includes(value)) {
			value = 0 // other
		}
		return (
			<Fragment>
				<Dropdown
					value={value}
					data={durationMulOptions}
					onChangeText={this._dropdownChange.bind(this)}
					dropdownMargins={{ min: 20, max: 60 }}
					dropdownOffset={{
						top: 0,
						left: 0
					}}
					containerStyle={{
						marginLeft: MAIN_PADDING,
						marginRight: MAIN_PADDING,
						marginTop: 8
					}}
					inputContainerStyle={{
						borderBottomColor: "transparent"
					}}
				/>
			</Fragment>
		)
	}
}
