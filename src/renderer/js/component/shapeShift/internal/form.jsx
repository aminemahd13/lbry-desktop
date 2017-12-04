import React from "react";
import Link from "component/link";
import { getExampleAddress } from "util/shape_shift";
import { Submit, FormRow } from "component/form";
import type { ShapeShiftFormValues, Dispatch } from "redux/actions/shape_shift";

type ShapeShiftFormErrors = {
  returnAddress?: string,
};

type Props = {
  values: ShapeShiftFormValues,
  errors: ShapeShiftFormErrors,
  touched: boolean,
  handleChange: Event => any,
  handleBlur: Event => any,
  handleSubmit: Event => any,
  isSubmitting: boolean,
  shiftSupportedCoins: Array<string>,
  originCoin: string,
  updating: boolean,
  getCoinStats: Dispatch,
  receiveAddress: string,
  originCoinDepositFee: number,
  originCoinDepositMin: string,
  originCoinDepositMax: number,
};

export default (props: Props) => {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    shiftSupportedCoins,
    originCoin,
    updating,
    getCoinStats,
    receiveAddress,
    originCoinDepositMax,
    originCoinDepositMin,
    originCoinDepositFee,
  } = props;
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-field">
        <span>{__("Exchange")} </span>
        <select
          className="form-field__input form-field__input-select"
          name="originCoin"
          onChange={e => {
            getCoinStats(e.target.value);
            handleChange(e);
          }}
        >
          {shiftSupportedCoins.map(coin => (
            <option key={coin} value={coin}>
              {coin}
            </option>
          ))}
        </select>
        <span> {__("for LBC")}</span>
        <p className="shapeshift__tx-info help">
          {!updating &&
            originCoinDepositMax && (
              <span>
                {__("Exchange max")}: {originCoinDepositMax} {originCoin}
                <br />
                {__("Exchange minimun")}: {originCoinDepositMin} {originCoin}
                <br />
                {__("Fee")}: {originCoinDepositFee} LBC
              </span>
            )}
        </p>
      </div>

      <FormRow
        type="text"
        name="returnAddress"
        placeholder={getExampleAddress(originCoin)}
        label={__("Return address")}
        onChange={handleChange}
        onBlur={handleBlur}
        value={values.returnAddress}
        errorMessage={errors.returnAddress}
        hasError={touched.returnAddress && errors.returnAddress}
      />
      <span className="help">
        <span>
          ({__("optional but recommended")}) {__("We will return your")}{" "}
          {originCoin}{" "}
          {__("to this address if the transaction doesn't go through.")}
        </span>
      </span>
      <div className="shapeshift__actions">
        <Submit
          label={__("Begin Conversion")}
          disabled={isSubmitting || !!Object.keys(errors).length}
        />
      </div>
    </form>
  );
};
